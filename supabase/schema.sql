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
