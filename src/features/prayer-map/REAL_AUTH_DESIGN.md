# Design doc: replacing the demo member gate with real auth + RLS

Status: **proposal, not implemented.** Written per the `TODO(real)` comments in
`hooks/useMemberSession.ts` and `components/SensitiveBlock.tsx`. No code
changes in this pass — this is what to review before we touch anything.

## The actual problem (not hypothetical)

Today `isMember` is a `useState<boolean>` toggled by typing `member2026`.
That boolean only decides which branch of `SensitiveBlock.tsx` renders —
blurred-and-locked vs. revealed. It does **not** gate what data reaches the
browser: `sensitive: SensitiveRequest[]` for every missionary (currently
Rebecca Johnson's 2 items) is a plain field inside the statically-bundled
`data/missionaries.ts`, shipped to *every* visitor's JS bundle on page load,
member or not. Anyone can read it from dev tools, view-source, or by flipping
one React state value in the console — no password needed. This matches the
comment already in `SensitiveBlock.tsx`: "the confidential text is present in
the client bundle and merely visually gated."

**The fix has to move the confidential text server-side with real
row-level access control** — a better client-side check alone can't close
this, no matter how it's implemented.

## What already exists in this codebase to build on

Two things make this smaller than "add auth from scratch":

1. **A working passwordless auth flow already exists** — `Checklist.jsx`'s
   `SignInForm` calls `supabase.auth.signInWithOtp({ email, options: {
   emailRedirectTo } })` (magic-link email, no password), then
   `supabase.auth.getUser()` / `getSession()` / `onAuthStateChange` for
   session state. Reusing this exact pattern means the prayer-map feature
   doesn't introduce a second, different auth mechanism — the `TODO(real)`
   comment's suggestion of Planning Center OIDC would be a much bigger,
   separate integration effort and isn't used anywhere else in this app.
2. **A working RLS convention already exists** in `supabase/schema.sql` —
   e.g. `checklist_items` (public read) and `user_checklist_progress`
   (`using (auth.uid() = user_id)`, private). The proposal below is the same
   pattern, not a new one.

## Proposed architecture

### Stage 1 (this is the part that actually satisfies the requirement)

Move **only the confidential rows** into Supabase with RLS. Public
missionary data (name, ministry, budget, non-sensitive prayer requests) can
stay exactly as it is today — bundled client-side — since none of it is
confidential. This keeps Stage 1 small and directly targeted at the one
real security requirement, instead of a full data-layer migration.

```sql
-- New tables — note "prayer_requests" is already taken by the world-map
-- feature in this schema, so these are named to avoid collision.

create table if not exists missionary_sensitive_requests (
  id uuid primary key default gen_random_uuid(),
  missionary_id text not null,   -- matches the existing string ids (e.g. 'johnson-ethiopia')
  text text not null,
  created_at timestamptz default now()
);

-- Admin-managed allowlist: being signed in is not the same as being a
-- verified church member. Keyed by email (not user_id) because an admin
-- needs to add someone who hasn't signed in yet — see the trigger below
-- for how user_id gets backfilled the first time that email actually
-- signs in. revoked_at gives an instant kill-switch — RLS re-checks this
-- on every query, so revoking access doesn't wait for a session timeout
-- the way client-side sign-out does today.
create table if not exists verified_members (
  id uuid primary key default gen_random_uuid(),
  church_email text not null unique,
  user_id uuid references auth.users,   -- null until this email signs in for the first time
  is_admin boolean not null default false,
  verified_by uuid references auth.users,  -- which admin added them
  verified_at timestamptz default now(),
  revoked_at timestamptz                   -- null = active
);

-- Auto-links a pre-added allowlist row to the real auth user the moment
-- they first sign in — this is what makes "admin adds jane@church.org
-- before jane has ever logged in" actually work.
create or replace function link_verified_member() returns trigger as $$
begin
  update verified_members
  set user_id = new.id
  where church_email = new.email and user_id is null;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function link_verified_member();

alter table missionary_sensitive_requests enable row level security;

create policy "Only verified members can read sensitive prayer requests"
  on missionary_sensitive_requests for select
  using (
    exists (
      select 1 from verified_members
      where verified_members.user_id = auth.uid()
      and verified_members.revoked_at is null
    )
  );

alter table verified_members enable row level security;

-- Everyone can see their own row (for "pending verification" UI) or, if
-- they're an active admin, every row (for the admin UI's member list).
create policy "Own row, or every row if you're an active admin"
  on verified_members for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from verified_members vm
      where vm.user_id = auth.uid() and vm.is_admin and vm.revoked_at is null
    )
  );

-- Only active admins can add or revoke members — never the client
-- directly on its own say-so.
create policy "Active admins can add verified members"
  on verified_members for insert
  with check (
    exists (
      select 1 from verified_members vm
      where vm.user_id = auth.uid() and vm.is_admin and vm.revoked_at is null
    )
  );

create policy "Active admins can revoke/update verified members"
  on verified_members for update
  using (
    exists (
      select 1 from verified_members vm
      where vm.user_id = auth.uid() and vm.is_admin and vm.revoked_at is null
    )
  );
```

**Bootstrapping the first admin:** the insert policy above requires an
*existing* admin, so there's necessarily a one-time manual step — the
first admin row gets inserted directly via the Supabase dashboard (or a
one-off script with the service-role key), same "no self-serve UI for the
very first setup step" precedent `schema.sql` already sets for
`checklist_items`. Every admin after that is added through the UI.

**Why this closes the actual gap:** if a non-member's browser queries
`missionary_sensitive_requests`, RLS makes Postgres return zero rows — not
an error, not the data with a "please hide this" flag the client could
ignore. The confidential text never leaves the database. Client-side
`isMember` state stops being a security boundary and becomes only a UI
hint ("should I attempt this fetch, or just show the locked/sign-in
prompt").

### Admin UI (part of Stage 1)

A small, separate, gated page — not linked from the main nav — where an
admin manages the allowlist directly instead of touching the Supabase
dashboard:

- **Route:** `/prayer-map/admin`, added as its own lazy-loaded route next
  to `/prayer-map` in `App.jsx`/`routeImports.js` (flat, matching this
  repo's existing routing convention — no nested-route restructuring
  needed).
- **Access:** renders a "sign in" prompt for anyone not `authState ===
  'verified'`; renders "you don't have admin access" for verified
  non-admins; only an admin (`is_admin && !revoked_at`) sees the actual
  page. This check is a UX nicety, same as `isMember` is today — the real
  boundary is the RLS insert/update policies above, which reject a
  non-admin's write regardless of what the UI shows them.
- **Contents:** a table of `verified_members` (email, verified date, admin
  flag, active/revoked status) fed by the "own row, or every row if admin"
  select policy; a form to add a member by email (inserts a row —
  `user_id` stays null until they actually sign in, per the trigger
  above); a revoke button per row (sets `revoked_at = now()`, takes effect
  on that person's very next query, no waiting on their session to
  expire).
- **New file:** `components/admin/MemberAdminPage.tsx` (or similar),
  reusing the existing `supabase.auth` session state from
  `useMemberSession.ts` rather than a separate auth path.

### Stage 2 (later, not required for the security fix itself)

Move the rest of the missionary dataset (name, ministry, budget,
non-sensitive prayer requests, updates) into Supabase too, for
admin-editability — `data/missionaries.ts` already has a `TODO(real): source
these from Supabase (admin-editable)` comment. Worth doing eventually, but
orthogonal to "confidential text must never reach a non-member" — that's
fully solved by Stage 1 alone.

## Auth + session flow changes

- **`MemberLoginSheet.tsx`**: swap the password field for an email field +
  `supabase.auth.signInWithOtp(...)`, mirroring `Checklist.jsx`'s
  `SignInForm` almost exactly (send button → "check your email" state →
  same error handling shape).
- **`useMemberSession.ts`**: replace the single `isMember: boolean` with a
  three-state model, since "signed in" and "verified member" are genuinely
  different things now:
  ```ts
  type AuthState = 'guest' | 'pending-verification' | 'verified';
  ```
  `pending-verification` is a real, expected state: someone's magic link
  worked (they proved they own that email) but their address isn't in
  `verified_members` yet. The UI should say "we don't have you on the
  church's list yet — contact [admin] to be added," not silently treat them
  as a guest.
- Drive this off `supabase.auth.onAuthStateChange` plus a `verified_members`
  lookup for the current `auth.uid()`, instead of a local password check.
- **Idle / absolute / leave-screen timeouts** (SPEC's 2 min / 10 min /
  blur-triggers): keep these client-side for UX (useful on a shared kiosk
  device), but they stop being *the* security boundary. Client sign-out
  should call `supabase.auth.signOut()` (actually invalidates the token)
  rather than just flipping local state — otherwise a copied/replayed token
  could just resume a "signed out" client. The real enforcement is
  Supabase's JWT expiry / refresh-token settings on the project, which
  should be configured to match (or be tighter than) these UX timeouts.

## Data-fetch changes

- **`SensitiveBlock.tsx`** currently receives the full `sensitive` array as
  a prop, always populated. It should instead trigger its own fetch (or
  receive an already-fetched, RLS-filtered result) —
  `supabase.from('missionary_sensitive_requests').select('*').eq('missionary_id', id)`
  — issued only when a card opens and only while `authState === 'verified'`.
  An empty result is now a legitimate signal ("RLS denied this," not "no
  sensitive requests exist") and should render the same locked state as
  today's `count === 0` case.
- No change needed to how public missionary data loads in Stage 1.

## File-by-file impact (Stage 1 only)

| File | Change |
|---|---|
| `supabase/schema.sql` | Add `missionary_sensitive_requests` + `verified_members` tables and the two RLS policies above |
| `hooks/useMemberSession.ts` | Replace `DEMO_MEMBER_PASSWORD` check with `supabase.auth` + `verified_members` lookup; `isMember: boolean` → `authState: 'guest' \| 'pending-verification' \| 'verified'` |
| `components/sheets/MemberLoginSheet.tsx` | Password field → email field + OTP, matching `Checklist.jsx`'s `SignInForm` |
| `components/SensitiveBlock.tsx` | Fetch sensitive rows itself (RLS-gated) instead of receiving a pre-populated prop |
| `data/missionaries.ts` | Remove `sensitive: SensitiveRequest[]` from the static mock data (it moves to the new table) |
| `data/types.ts` | Drop `SensitiveRequest` from `Missionary`; it's no longer bundled data |
| `components/admin/MemberAdminPage.tsx` *(new)* | Admin page: member list + add-by-email form + revoke button |
| `App.jsx` / `routeImports.js` | Add the `/prayer-map/admin` lazy route |

Not touched in Stage 1: `PrayerMapPage.tsx`'s overall structure, `MemberStatusBadge.tsx`, `IdleToast.tsx`, the map/pin components, budget/updates — none of that data is confidential.

## Decisions so far

- **Admin UI: in scope.** Multiple people can be admins, all managing one
  shared `verified_members` list (design above) — not a full multi-tenant
  model with separate churches each running their own isolated missionary
  roster. If you actually meant separate churches with separate rosters
  (not just several admins), that's a bigger change — it'd need a
  `church_id` on both `verified_members` and (eventually, Stage 2)
  `missionaries` — flag it and I'll redo this section before we build
  anything.
- **Stronger membership verification (domain-restricted emails, ChMS
  integration): deferred, not designed yet.** OTP + admin-managed allowlist
  is the answer for now. Noting it here so it isn't forgotten: whoever
  becomes an admin should understand OTP only proves inbox ownership, not
  church membership — the allowlist is doing the actual membership check,
  and its accuracy depends entirely on admins keeping it current.
- **Stage 2 (moving the rest of the missionary data to Supabase):
  deferred.** Not required for the security fix; revisit later.

Let me know if the admin-scope assumption above is right, and I'll start on Stage 1.
