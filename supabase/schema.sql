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

-- Same idempotency issue as the policies below: `create trigger` has no
-- `if not exists` form either, so this needs its own drop-first guard.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function link_verified_member();

alter table missionary_sensitive_requests enable row level security;

-- Postgres has no `create policy if not exists`, so a plain `create policy`
-- errors "policy already exists" on a database that already has one under
-- this name — e.g. if only the pre-fix version of the two verified_members
-- policies below (see the is_active_verified_admin comment) was ever
-- applied to this database. The `drop ... if exists` makes re-running this
-- file safe to pick up a fixed definition regardless of what's already live.
drop policy if exists "Only verified members can read sensitive prayer requests" on missionary_sensitive_requests;
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
drop policy if exists "Own row, or every row if you're an active admin" on verified_members;
create policy "Own row, or every row if you're an active admin"
  on verified_members for select
  using (
    user_id = auth.uid()
    or is_active_verified_admin(auth.uid())
  );

-- Only active admins can add or revoke members — never the client
-- directly on its own say-so.
drop policy if exists "Active admins can add verified members" on verified_members;
create policy "Active admins can add verified members"
  on verified_members for insert
  with check (is_active_verified_admin(auth.uid()));

drop policy if exists "Active admins can revoke/update verified members" on verified_members;
create policy "Active admins can revoke/update verified members"
  on verified_members for update
  using (is_active_verified_admin(auth.uid()));

-- Separate from revoke (soft: sets revoked_at, reversible, keeps history).
-- Delete is a hard removal — an admin cleaning up a row entirely, not just
-- cutting off access.
drop policy if exists "Active admins can delete verified members" on verified_members;
create policy "Active admins can delete verified members"
  on verified_members for delete
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

-- Access requests: anyone who has signed in (via the same magic-link flow
-- Checklist.jsx and this feature both use) but has no verified_members row
-- yet shows up here as an implicit request — no separate "request access"
-- action needed, since signing in once is enough. Note this is signed-in
-- app-wide, not prayer-map-specific: someone who only ever used the
-- Checklist feature will also appear here once. That's an accepted
-- tradeoff of not requiring a dedicated request step; harmless since an
-- admin can just deny/ignore an unrelated email.
create table if not exists denied_access_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  denied_by uuid references auth.users,
  denied_at timestamptz default now()
);

alter table denied_access_requests enable row level security;

drop policy if exists "Active admins can view denied requests" on denied_access_requests;
create policy "Active admins can view denied requests"
  on denied_access_requests for select
  using (is_active_verified_admin(auth.uid()));

drop policy if exists "Active admins can deny access requests" on denied_access_requests;
create policy "Active admins can deny access requests"
  on denied_access_requests for insert
  with check (is_active_verified_admin(auth.uid()));

-- auth.users isn't exposed through the REST API, so listing pending
-- requests needs a security-definer function (same reasoning as
-- is_active_verified_admin above) — it reads auth.users as its owner, but
-- the inline admin check means a non-admin caller gets zero rows back,
-- not an error, matching this file's existing fail-closed pattern.
create or replace function list_access_requests()
returns table (request_user_id uuid, email text, requested_at timestamptz) as $$
  select u.id, u.email, u.created_at
  from auth.users u
  where is_active_verified_admin(auth.uid())
    and not exists (select 1 from verified_members vm where vm.user_id = u.id)
    and not exists (select 1 from denied_access_requests d where d.email = u.email)
  order by u.created_at desc;
$$ language sql security definer set search_path = public;

-- Prayer map: missionary records (Stage 2 of REAL_AUTH_DESIGN.md) --------
-- Public, non-confidential missionary data (name, location, ministry,
-- budget line items, non-sensitive prayer requests, updates) — previously
-- hardcoded in src/features/prayer-map/data/missionaries.ts, now
-- admin-editable via /prayer-map/admin instead of requiring a code deploy.
-- Confidential prayer text stays exactly where Stage 1 put it
-- (missionary_sensitive_requests, above) — this table only ever holds what
-- was already public in the old static file.
create table if not exists missionaries (
  id text primary key, -- matches the existing string ids (e.g. 'johnson-ethiopia')
  name text not null,
  name_note text,
  location text not null,
  lat double precision not null,
  lng double precision not null,
  role text not null,
  ministry text not null,
  prayer_count integer not null default 0,
  support_goal integer not null default 0,
  -- BudgetLine[], PrayerRequest[], MissionaryUpdate[] — see data/types.ts.
  -- Kept as jsonb rather than normalized child tables: these are small,
  -- always-edited-as-a-unit lists (a handful of rows each) with no need to
  -- query into their fields independently, and matching the existing
  -- Missionary/MissionaryWithBudget shape as one row keeps the client-side
  -- code (deriveBudget.ts, MissionaryCard.tsx) unchanged.
  budget jsonb not null default '[]',
  prayer_requests jsonb not null default '[]',
  sensitive_count integer not null default 0,
  updates jsonb not null default '[]',
  location_sensitive boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table missionaries enable row level security;

-- Public read — same as the static file it replaces, this is all
-- non-confidential data meant for every visitor, member or not.
drop policy if exists "Anyone can view missionaries" on missionaries;
create policy "Anyone can view missionaries"
  on missionaries for select
  using (true);

drop policy if exists "Active admins can add missionaries" on missionaries;
create policy "Active admins can add missionaries"
  on missionaries for insert
  with check (is_active_verified_admin(auth.uid()));

drop policy if exists "Active admins can update missionaries" on missionaries;
create policy "Active admins can update missionaries"
  on missionaries for update
  using (is_active_verified_admin(auth.uid()));

drop policy if exists "Active admins can delete missionaries" on missionaries;
create policy "Active admins can delete missionaries"
  on missionaries for delete
  using (is_active_verified_admin(auth.uid()));

-- Storage bucket for missionary update photos, uploaded from the admin's
-- "Updates" editor (AdminMissionaries.tsx) instead of requiring a photo
-- already hosted somewhere else. Public bucket — these are the same
-- non-confidential update photos that used to ship as Vite-bundled assets.
insert into storage.buckets (id, name, public)
values ('missionary-photos', 'missionary-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public can view missionary photos" on storage.objects;
create policy "Public can view missionary photos"
  on storage.objects for select
  using (bucket_id = 'missionary-photos');

drop policy if exists "Active admins can upload missionary photos" on storage.objects;
create policy "Active admins can upload missionary photos"
  on storage.objects for insert
  with check (bucket_id = 'missionary-photos' and is_active_verified_admin(auth.uid()));

drop policy if exists "Active admins can delete missionary photos" on storage.objects;
create policy "Active admins can delete missionary photos"
  on storage.objects for delete
  using (bucket_id = 'missionary-photos' and is_active_verified_admin(auth.uid()));

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

-- Missionary support-matching: profiles, doctrinal tags, intro requests ---
-- Greenfield tables for the missionary/church support-matching feature
-- (Phase 1). Distinct from `missionaries` above, which is the prayer-map's
-- admin-managed public listing table — these are user-owned profiles keyed
-- to auth.users, with their own approval workflow and doctrinal-tag join
-- tables. Does not touch the pre-field checklist tables above.

do $$ begin
  create type profile_status as enum ('pending_review','approved','rejected','inactive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_level as enum ('self_reported','agency_verified');
exception when duplicate_object then null; end $$;

do $$ begin
  create type field_visibility as enum ('public','region_only','private');
exception when duplicate_object then null; end $$;

do $$ begin
  create type intro_status as enum ('requested','accepted','declined','expired');
exception when duplicate_object then null; end $$;

-- Doctrinal tags: fixed taxonomy — do not let users free-type tags.
create table if not exists doctrinal_tags (
  id text primary key,
  label text not null,
  category text not null
);

insert into doctrinal_tags (id, label, category) values
  ('credobaptist', 'Believer''s Baptism', 'baptism'),
  ('paedobaptist', 'Infant Baptism', 'baptism'),
  ('complementarian', 'Complementarian', 'gender_roles'),
  ('egalitarian', 'Egalitarian', 'gender_roles'),
  ('cessationist', 'Cessationist', 'spiritual_gifts'),
  ('continuationist', 'Continuationist', 'spiritual_gifts'),
  ('reformed_soteriology', 'Reformed / Calvinist Soteriology', 'soteriology'),
  ('arminian_soteriology', 'Arminian Soteriology', 'soteriology'),
  ('premillennial', 'Premillennial', 'eschatology'),
  ('amillennial', 'Amillennial', 'eschatology'),
  ('kjv_only', 'KJV-Preferred/Only', 'bible_translation'),
  ('congregational_polity', 'Congregational Polity', 'church_government'),
  ('elder_led_polity', 'Elder-Led Polity', 'church_government')
on conflict (id) do nothing;

create table if not exists missionary_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  status profile_status not null default 'pending_review',
  verification verification_level not null default 'self_reported',
  display_name text not null,
  agency_name text,
  field_region text,
  field_visibility field_visibility not null default 'region_only',
  home_base_city text,
  home_base_state text,
  support_target_monthly numeric,
  support_raised_pct numeric check (support_raised_pct >= 0 and support_raised_pct <= 100),
  family_size int,
  bio text,
  -- Plain URL, rendered on the profile as a normal <a href> hyperlink —
  -- never embedded as an <img>/iframe or injected as raw HTML, so a
  -- submission can point to a site without hotlinking its content.
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists missionary_doctrinal_tags (
  missionary_id uuid not null references missionary_profiles(id) on delete cascade,
  tag_id text not null references doctrinal_tags(id),
  primary key (missionary_id, tag_id)
);

create table if not exists church_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  status profile_status not null default 'pending_review',
  church_name text not null,
  city text,
  state text,
  denomination text,
  giving_capacity_tier text,
  -- Same convention as missionary_profiles.website — plain URL, rendered as
  -- a hyperlink, never embedded.
  website text,
  bio text,
  missions_focus text,
  contact_name text,
  contact_role text,
  hosts_short_term_trips boolean not null default false,
  sends_teams boolean not null default false,
  hosts_furloughs boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists church_doctrinal_tags (
  church_id uuid not null references church_profiles(id) on delete cascade,
  tag_id text not null references doctrinal_tags(id),
  primary key (church_id, tag_id)
);

-- One-time ALTERs for columns added after the tables' first deploy — the
-- `create table if not exists` blocks above are no-ops against an already-
-- deployed database, so each new column has to be added explicitly here too.
alter table missionary_profiles add column if not exists website text;
alter table church_profiles add column if not exists website text;
alter table church_profiles add column if not exists bio text;
alter table church_profiles add column if not exists missions_focus text;
alter table church_profiles add column if not exists contact_name text;
alter table church_profiles add column if not exists contact_role text;
alter table church_profiles add column if not exists hosts_short_term_trips boolean not null default false;
alter table church_profiles add column if not exists sends_teams boolean not null default false;
alter table church_profiles add column if not exists hosts_furloughs boolean not null default false;

create table if not exists intro_requests (
  id uuid primary key default gen_random_uuid(),
  church_id uuid not null references church_profiles(id) on delete cascade,
  missionary_id uuid not null references missionary_profiles(id) on delete cascade,
  status intro_status not null default 'requested',
  message text,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

-- Prevent duplicate pending requests from the same church to the same missionary
create unique index if not exists intro_requests_no_duplicate_pending
  on intro_requests (church_id, missionary_id)
  where status = 'requested';

alter table missionary_profiles enable row level security;
alter table church_profiles enable row level security;
alter table missionary_doctrinal_tags enable row level security;
alter table church_doctrinal_tags enable row level security;
alter table intro_requests enable row level security;

-- Missionary profiles: public can read approved rows; owner reads/writes their own regardless of status
drop policy if exists "missionary_profiles_public_read_approved" on missionary_profiles;
create policy "missionary_profiles_public_read_approved"
  on missionary_profiles for select
  using (status = 'approved');

drop policy if exists "missionary_profiles_owner_read" on missionary_profiles;
create policy "missionary_profiles_owner_read"
  on missionary_profiles for select
  using (auth.uid() = id);

drop policy if exists "missionary_profiles_owner_write" on missionary_profiles;
create policy "missionary_profiles_owner_write"
  on missionary_profiles for insert
  with check (auth.uid() = id);

drop policy if exists "missionary_profiles_owner_update" on missionary_profiles;
create policy "missionary_profiles_owner_update"
  on missionary_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Church profiles: same pattern as missionary_profiles above. Originally
-- owner-only ("no public 'browse churches' needed in Phase 1, but keep
-- symmetry") — /for-missionaries now needs the same public-read-when-
-- approved policy missionary_profiles already had, for churches to be
-- browsable by missionaries the same way missionaries are browsable by
-- churches on /for-churches.
drop policy if exists "church_profiles_public_read_approved" on church_profiles;
create policy "church_profiles_public_read_approved"
  on church_profiles for select
  using (status = 'approved');

drop policy if exists "church_profiles_owner_read" on church_profiles;
create policy "church_profiles_owner_read"
  on church_profiles for select
  using (auth.uid() = id);

drop policy if exists "church_profiles_owner_write" on church_profiles;
create policy "church_profiles_owner_write"
  on church_profiles for insert
  with check (auth.uid() = id);

drop policy if exists "church_profiles_owner_update" on church_profiles;
create policy "church_profiles_owner_update"
  on church_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Doctrinal tag join tables: readable wherever the parent profile is readable; writable only by owner
drop policy if exists "missionary_tags_read" on missionary_doctrinal_tags;
create policy "missionary_tags_read"
  on missionary_doctrinal_tags for select
  using (
    exists (
      select 1 from missionary_profiles p
      where p.id = missionary_id and (p.status = 'approved' or p.id = auth.uid())
    )
  );

drop policy if exists "missionary_tags_write" on missionary_doctrinal_tags;
create policy "missionary_tags_write"
  on missionary_doctrinal_tags for all
  using (auth.uid() = missionary_id)
  with check (auth.uid() = missionary_id);

drop policy if exists "church_tags_read" on church_doctrinal_tags;
create policy "church_tags_read"
  on church_doctrinal_tags for select
  using (
    exists (
      select 1 from church_profiles c
      where c.id = church_id and (c.status = 'approved' or c.id = auth.uid())
    )
  );

drop policy if exists "church_tags_write" on church_doctrinal_tags;
create policy "church_tags_write"
  on church_doctrinal_tags for all
  using (auth.uid() = church_id)
  with check (auth.uid() = church_id);

-- Intro requests: readable/writable only by the two parties involved
drop policy if exists "intro_requests_parties_read" on intro_requests;
create policy "intro_requests_parties_read"
  on intro_requests for select
  using (auth.uid() = church_id or auth.uid() = missionary_id);

drop policy if exists "intro_requests_church_creates" on intro_requests;
create policy "intro_requests_church_creates"
  on intro_requests for insert
  with check (
    auth.uid() = church_id
    and exists (select 1 from church_profiles c where c.id = church_id and c.status = 'approved')
    and exists (select 1 from missionary_profiles m where m.id = missionary_id and m.status = 'approved')
  );

drop policy if exists "intro_requests_missionary_responds" on intro_requests;
create policy "intro_requests_missionary_responds"
  on intro_requests for update
  using (auth.uid() = missionary_id)
  with check (auth.uid() = missionary_id);

-- Missionary/church support-matching: admin review + status lock ---------
-- The admin review queue (Step 5 of the missionary-support build plan) needs
-- to update *other* users' rows, which the owner-only update policies above
-- don't allow (their USING clause is auth.uid() = id). Reuses the same
-- is_active_verified_admin()/verified_members admin concept the prayer-map
-- feature already established above, rather than introducing a second admin
-- mechanism.
drop policy if exists "missionary_profiles_admin_update" on missionary_profiles;
create policy "missionary_profiles_admin_update"
  on missionary_profiles for update
  using (is_active_verified_admin(auth.uid()))
  with check (is_active_verified_admin(auth.uid()));

drop policy if exists "church_profiles_admin_update" on church_profiles;
create policy "church_profiles_admin_update"
  on church_profiles for update
  using (is_active_verified_admin(auth.uid()))
  with check (is_active_verified_admin(auth.uid()));

-- Status/verification are review-controlled fields: a profile owner can edit
-- their own bio, region, etc., but must never be able to set status straight
-- to 'approved' (or verification to 'agency_verified') via their own update
-- — only an active admin (Step 5's review queue) may change those.
create or replace function lock_missionary_profile_review_fields() returns trigger as $$
begin
  if (new.status is distinct from old.status or new.verification is distinct from old.verification)
     and not is_active_verified_admin(auth.uid()) then
    raise exception 'status and verification can only be changed by an admin';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists lock_missionary_profile_review_fields on missionary_profiles;
create trigger lock_missionary_profile_review_fields
  before update on missionary_profiles
  for each row execute function lock_missionary_profile_review_fields();

create or replace function lock_church_profile_review_fields() returns trigger as $$
begin
  if new.status is distinct from old.status
     and not is_active_verified_admin(auth.uid()) then
    raise exception 'status can only be changed by an admin';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists lock_church_profile_review_fields on church_profiles;
create trigger lock_church_profile_review_fields
  before update on church_profiles
  for each row execute function lock_church_profile_review_fields();

-- Dual-profile-type exclusivity: nothing today stops a single auth.users id
-- from ending up with rows in both missionary_profiles and church_profiles
-- (e.g. a race between two tabs). Raise loudly instead of allowing it.
create or replace function prevent_dual_profile_type() returns trigger as $$
begin
  if tg_table_name = 'missionary_profiles' then
    if exists (select 1 from church_profiles where id = new.id) then
      raise exception 'This account already has a church profile.';
    end if;
  else
    if exists (select 1 from missionary_profiles where id = new.id) then
      raise exception 'This account already has a missionary profile.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists prevent_dual_profile_missionary on missionary_profiles;
create trigger prevent_dual_profile_missionary
  before insert on missionary_profiles
  for each row execute function prevent_dual_profile_type();

drop trigger if exists prevent_dual_profile_church on church_profiles;
create trigger prevent_dual_profile_church
  before insert on church_profiles
  for each row execute function prevent_dual_profile_type();

-- The admin-update policies above only cover UPDATE — the review queue
-- (Step 5) also needs to SELECT pending_review rows belonging to other
-- users, which no existing select policy allows (missionary_profiles' own
-- public-read policy is approved-only; church_profiles and both
-- doctrinal_tags join tables are owner-read-only). Same
-- is_active_verified_admin() reuse as the update policies.
drop policy if exists "missionary_profiles_admin_read" on missionary_profiles;
create policy "missionary_profiles_admin_read"
  on missionary_profiles for select
  using (is_active_verified_admin(auth.uid()));

drop policy if exists "church_profiles_admin_read" on church_profiles;
create policy "church_profiles_admin_read"
  on church_profiles for select
  using (is_active_verified_admin(auth.uid()));

drop policy if exists "missionary_tags_admin_read" on missionary_doctrinal_tags;
create policy "missionary_tags_admin_read"
  on missionary_doctrinal_tags for select
  using (is_active_verified_admin(auth.uid()));

drop policy if exists "church_tags_admin_read" on church_doctrinal_tags;
create policy "church_tags_admin_read"
  on church_doctrinal_tags for select
  using (is_active_verified_admin(auth.uid()));

-- Intro request notification (Step 8) ------------------------------------
-- Fires a Slack message on every intro_requests insert, containing the
-- church name, missionary name, and message. No missionary-side inbox yet
-- (per the build plan) — this is the only way the request surfaces, until
-- volume justifies more.
--
-- The webhook URL is deliberately NOT in this file: a Slack incoming
-- webhook URL is a bearer secret (anyone with it can post to the channel),
-- so it doesn't belong in a file that gets committed to git. It's read at
-- call time from Supabase Vault instead — see the separate one-off
-- `vault.create_secret(...)` command (not part of this file) that stores
-- the actual URL directly in the database.
create extension if not exists pg_net with schema extensions;

create or replace function notify_intro_request() returns trigger as $$
declare
  webhook_url text;
  church_name text;
  missionary_name text;
begin
  select decrypted_secret into webhook_url
  from vault.decrypted_secrets
  where name = 'intro_request_slack_webhook';

  -- No secret configured yet — don't block the insert just because the
  -- notification can't be sent.
  if webhook_url is null then
    return new;
  end if;

  select c.church_name into church_name from church_profiles c where c.id = new.church_id;
  select m.display_name into missionary_name from missionary_profiles m where m.id = new.missionary_id;

  -- Fire-and-forget: net.http_post queues the request asynchronously and
  -- returns immediately, so a slow or failing webhook never blocks or
  -- fails the actual intro_requests insert.
  perform net.http_post(
    url := webhook_url,
    body := jsonb_build_object(
      'text', format(
        E'New intro request\n%s wants an intro to %s.%s',
        coalesce(church_name, 'A church'),
        coalesce(missionary_name, 'a missionary'),
        case when new.message is not null and new.message <> ''
          then E'\nMessage: ' || new.message
          else ''
        end
      )
    ),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );

  return new;
end;
$$ language plpgsql security definer set search_path = public, extensions, vault;

drop trigger if exists on_intro_request_created on intro_requests;
create trigger on_intro_request_created
  after insert on intro_requests
  for each row execute function notify_intro_request();

-- Missionary dashboard (Step 9) --------------------------------------------
-- The dashboard's intro-requests list joins church_profiles to show which
-- church sent each request — no existing policy lets a missionary read a
-- church's row for that (church_profiles' only select policies are
-- owner-read and admin-read), so the join would silently come back null.
-- Queries intro_requests, not church_profiles itself, so this isn't the
-- self-recursive pattern flagged elsewhere in this file.
drop policy if exists "church_profiles_read_by_requested_missionary" on church_profiles;
create policy "church_profiles_read_by_requested_missionary"
  on church_profiles for select
  using (
    exists (
      select 1 from intro_requests ir
      where ir.church_id = church_profiles.id and ir.missionary_id = auth.uid()
    )
  );
