-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

create table if not exists profiles (
  id uuid references auth.users primary key,
  full_name text,
  theological_tradition text,
  field_interest text,
  support_raising_comfort text,
  marital_status text,
  created_at timestamptz default now()
);

create table if not exists prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users,
  people_group_name text,
  country text,
  request text,
  created_at timestamptz default now()
);

-- Row Level Security: users can only read/write their own profile
alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Prayer requests are public to read, but only the author can write/delete
alter table prayer_requests enable row level security;

create policy "Anyone can read prayer requests"
  on prayer_requests for select
  using (true);

create policy "Users can insert own prayer requests"
  on prayer_requests for insert
  with check (auth.uid() = user_id);

-- Pre-field checklist -----------------------------------------------------
-- Static content, seeded/managed via SQL for v1 (no admin UI). See
-- seed_checklist_items.sql for the actual task list.
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  description text,
  external_link text,
  role_tags text[] not null default '{}',   -- e.g. {'long_term','short_term'} — empty = universal
  access_tags text[] not null default '{}', -- e.g. {'creative_access','restricted_access'} — empty = universal
  sort_order int not null default 0
);

create table if not exists user_checklist_profile (
  user_id uuid primary key references auth.users,
  role_type text not null,
  access_level text not null,
  updated_at timestamptz default now()
);

create table if not exists user_checklist_progress (
  user_id uuid not null references auth.users,
  item_id uuid not null references checklist_items,
  completed_at timestamptz default now(),
  primary key (user_id, item_id)
);

-- Checklist items are static reference content — readable by anyone, only
-- editable via the Supabase SQL editor for v1.
alter table checklist_items enable row level security;

create policy "Anyone can read checklist items"
  on checklist_items for select
  using (true);

-- Users can only see/manage their own checklist profile and progress.
alter table user_checklist_profile enable row level security;

create policy "Users can view own checklist profile"
  on user_checklist_profile for select
  using (auth.uid() = user_id);

create policy "Users can insert own checklist profile"
  on user_checklist_profile for insert
  with check (auth.uid() = user_id);

create policy "Users can update own checklist profile"
  on user_checklist_profile for update
  using (auth.uid() = user_id);

alter table user_checklist_progress enable row level security;

create policy "Users can view own checklist progress"
  on user_checklist_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own checklist progress"
  on user_checklist_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own checklist progress"
  on user_checklist_progress for delete
  using (auth.uid() = user_id);

-- Prayer map: confidential prayer requests -------------------------------
-- Stage 1 of src/features/prayer-map/REAL_AUTH_DESIGN.md. Replaces the
-- client-side DEMO_MEMBER_PASSWORD gate (useMemberSession.ts) — confidential
-- text now lives only in a table RLS actually protects, instead of a plain
-- field in the client-bundled mock data. Note "prayer_requests" above is a
-- different, unrelated feature (world-map quiz) — these are named distinctly
-- to avoid colliding with it.

create table if not exists missionary_sensitive_requests (
  id uuid primary key default gen_random_uuid(),
  missionary_id text not null,   -- matches the existing string ids (e.g. 'johnson-ethiopia')
  text text not null,
  created_at timestamptz default now()
);

-- Admin-managed allowlist: being signed in is not the same as being a
-- verified church member. Keyed by email (not user_id) because an admin
-- needs to add someone who hasn't signed in yet — see the trigger below
-- for how user_id gets backfilled the first time that email actually signs
-- in. revoked_at gives an instant kill-switch — RLS re-checks this on
-- every query, so revoking access doesn't wait for a session timeout the
-- way client-side sign-out alone would.
create table if not exists verified_members (
  id uuid primary key default gen_random_uuid(),
  church_email text not null unique,
  user_id uuid references auth.users,      -- null until this email signs in for the first time
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

-- A policy on verified_members that subqueries verified_members itself (to
-- check "is this requester an admin?") makes Postgres re-apply that same
-- policy to evaluate the subquery, which recurses forever (error 42P17,
-- "infinite recursion detected in policy"). A security-definer function
-- runs as its owner (bypassing RLS, same as link_verified_member() above),
-- so the admin check inside it doesn't re-trigger the policy that calls it.
create or replace function is_active_verified_admin(check_user_id uuid) returns boolean as $$
  select exists (
    select 1 from verified_members
    where user_id = check_user_id and is_admin and revoked_at is null
  );
$$ language sql security definer set search_path = public;

-- Everyone can see their own row (for "pending verification" UI) or, if
-- they're an active admin, every row (for the admin UI's member list).
create policy "Own row, or every row if you're an active admin"
  on verified_members for select
  using (
    user_id = auth.uid()
    or is_active_verified_admin(auth.uid())
  );

-- Only active admins can add or revoke members — never the client
-- directly on its own say-so.
create policy "Active admins can add verified members"
  on verified_members for insert
  with check (is_active_verified_admin(auth.uid()));

create policy "Active admins can revoke/update verified members"
  on verified_members for update
  using (is_active_verified_admin(auth.uid()));

-- Bootstrapping: the insert policy above requires an *existing* admin, so
-- the very first admin row must be inserted manually once, via the
-- Supabase dashboard or a one-off script with the service-role key — same
-- "no self-serve UI for the very first setup step" precedent this file
-- already takes with checklist_items. Every admin after that is added
-- through the admin UI. Example (run once, after that first admin has
-- signed in at least once so their auth.users row/id exists):
--
--   insert into verified_members (church_email, user_id, is_admin, verified_at)
--   values ('admin@yourchurch.org', '<their auth.users.id>', true, now());

-- Opportunities: auth-linked favorites -----------------------------------
-- Favorites used to live only in localStorage (fielded_saved_opps), so they
-- were device-owned — sign in on a second device and the list was empty.
-- This makes Supabase the source of truth once a user is signed in; the
-- client still keeps localStorage as the signed-out fallback and merges the
-- two (union, never a wholesale overwrite) the first time a session appears.
-- opportunity_id isn't a foreign key here because the `opportunities` table
-- itself isn't managed through this schema file (see scripts/sync-opportunities
-- and generate-component.js — it's populated by a separate scraper pipeline).
create table if not exists saved_opportunities (
  user_id uuid not null references auth.users,
  opportunity_id text not null,
  created_at timestamptz default now(),
  primary key (user_id, opportunity_id)
);

alter table saved_opportunities enable row level security;

create policy "Users can view own saved opportunities"
  on saved_opportunities for select
  using (auth.uid() = user_id);

create policy "Users can save own opportunities"
  on saved_opportunities for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave own opportunities"
  on saved_opportunities for delete
  using (auth.uid() = user_id);

-- Opportunities: sanitize-pipeline columns (P1-C) ------------------------
-- The `opportunities` table itself lives outside this file (see the DDL
-- comment in scripts/lib/supabase-client.js — it's populated by the scraper
-- pipeline, not migrated here), but its columns still need this one-time
-- ALTER so scripts/lib/sanitize.js's output has somewhere to land:
-- description_full (untruncated sanitized text — `description` becomes the
-- ≤200-char card version), listing_type ('opening' | 'category_page'),
-- stale_flag (a >12-month-old date mentioned in the listing), and
-- merged_titles (near-dupe title variants collapsed into this record).
alter table opportunities
  add column if not exists description_full text,
  add column if not exists listing_type text,
  add column if not exists stale_flag boolean not null default false,
  add column if not exists merged_titles text[] not null default '{}';
