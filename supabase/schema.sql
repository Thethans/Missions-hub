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
