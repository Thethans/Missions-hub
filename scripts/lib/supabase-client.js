// Server-side Supabase client — uses the service-role key so the sync script
// can insert/upsert rows without RLS restrictions. The browser client in
// src/supabaseClient.js uses the anon key + RLS for reads.
//
// ── Required Supabase table (run once in the SQL editor) ──────────────
//
//   create table if not exists opportunities (
//     id            uuid default gen_random_uuid() primary key,
//     agency        text not null,
//     title         text not null,
//     url           text not null unique,
//     location      text,
//     region        text,
//     role_type     text,
//     term_length   text,
//     description   text,
//     date_posted   date,
//     scraped_at    timestamptz not null default now(),
//     raw_html      text,
//     active        boolean not null default true,
//     constraint opportunities_url_key unique (url)
//   );
//
//   create index if not exists idx_opportunities_agency on opportunities (agency);
//   create index if not exists idx_opportunities_active on opportunities (active);
//
//   -- RLS: public read, service-role write
//   alter table opportunities enable row level security;
//   create policy "Public read" on opportunities for select using (true);
//
// ──────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error(
    'Missing SUPABASE_URL (or VITE_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY env vars. ' +
    'See .env.example for the required variables.'
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false }
});
