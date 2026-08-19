#!/usr/bin/env node

// Seeds 3 example missionary profiles and 3 example church profiles so
// /for-churches and /for-missionaries aren't empty directories. Clearly
// fictional — every seeded row uses an @example.com auth email and every
// name/bio here is invented for this seed, not a real person or church.
//
// missionary_profiles.id / church_profiles.id both reference auth.users(id)
// (see supabase/schema.sql), so a profile can't just be an INSERT — each
// one needs a real auth user first. That's exactly what
// supabase.auth.admin.createUser() is for; a raw SQL INSERT into auth.users
// would mean hand-matching Supabase's internal auth schema (instance_id,
// aud, encrypted_password, etc.), which is undocumented and version-
// -fragile, so this is a script using the Admin API instead of a .sql file.
//
// Idempotent: re-running skips any example email that's already a user.
//
// Usage:
//   node scripts/seed-example-profiles.js
//
// Requires SUPABASE_URL (or VITE_SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY
// in the environment (see .env.example) — this bypasses RLS by design, so
// only ever run it yourself, never wire it into CI.

import 'dotenv/config';
import { supabase } from './lib/supabase-client.js';

const MISSIONARIES = [
  {
    email: 'grace.morrow@example.com',
    profile: {
      display_name: 'Grace Morrow',
      agency_name: 'Crossworld',
      field_region: 'Southeast Asia',
      field_visibility: 'region_only',
      home_base_city: 'Springfield',
      home_base_state: 'MO',
      support_target_monthly: 4500,
      support_raised_pct: 68,
      family_size: 1,
      bio: 'Teaching English and discipling university students in a creative-access country. Serving with Crossworld since 2021.',
      website: null,
      verification: 'agency_verified'
    },
    tagIds: ['credobaptist', 'complementarian', 'reformed_soteriology']
  },
  {
    email: 'daniel.okafor@example.com',
    profile: {
      display_name: 'Daniel & Ruth Okafor',
      agency_name: 'SIM International',
      field_region: 'West Africa',
      field_visibility: 'region_only',
      home_base_city: 'Dallas',
      home_base_state: 'TX',
      support_target_monthly: 6200,
      support_raised_pct: 41,
      family_size: 4,
      bio: 'Church-planting among an unreached people group, with a focus on leadership training for local pastors.',
      website: 'https://example.com/okafor-family',
      verification: 'self_reported'
    },
    tagIds: ['paedobaptist', 'egalitarian', 'elder_led_polity']
  },
  {
    email: 'mei.lin.tan@example.com',
    profile: {
      display_name: 'Mei-Lin Tan',
      agency_name: 'OMF International',
      field_region: 'East Asia',
      field_visibility: 'private',
      home_base_city: 'Vancouver',
      home_base_state: 'BC',
      support_target_monthly: 3800,
      support_raised_pct: 92,
      family_size: 1,
      bio: 'Medical missionary running a rural clinic; location kept private for security.',
      website: null,
      verification: 'agency_verified'
    },
    tagIds: ['credobaptist', 'continuationist', 'premillennial']
  }
];

const CHURCHES = [
  {
    email: 'firstpres.springfield@example.com',
    profile: {
      church_name: 'First Presbyterian Church',
      city: 'Springfield',
      state: 'MO',
      denomination: 'Presbyterian (PCA)',
      giving_capacity_tier: 'large',
      website: 'https://example.com/firstpres-springfield',
      bio: 'A congregation of about 600 with a dedicated missions committee that has supported field workers for over 30 years.',
      missions_focus: 'Church planting and theological education in East Africa and Southeast Asia.',
      contact_name: 'Robert Hail',
      contact_role: 'Missions Pastor',
      hosts_short_term_trips: true,
      sends_teams: true,
      hosts_furloughs: true
    },
    tagIds: ['paedobaptist', 'complementarian', 'reformed_soteriology', 'elder_led_polity']
  },
  {
    email: 'gracecommunity.dallas@example.com',
    profile: {
      church_name: 'Grace Community Church',
      city: 'Dallas',
      state: 'TX',
      denomination: 'Non-denominational',
      giving_capacity_tier: 'medium',
      website: 'https://example.com/grace-community-dallas',
      bio: 'A growing multi-site church seeking to build long-term partnerships with a small number of missionary families.',
      missions_focus: 'Unreached people groups, with a particular interest in creative-access countries.',
      contact_name: 'Priya Nair',
      contact_role: 'Global Outreach Director',
      hosts_short_term_trips: true,
      sends_teams: false,
      hosts_furloughs: true
    },
    tagIds: ['credobaptist', 'egalitarian', 'continuationist']
  },
  {
    email: 'riverside.vancouver@example.com',
    profile: {
      church_name: 'Riverside Baptist Church',
      city: 'Vancouver',
      state: 'BC',
      denomination: 'Baptist',
      giving_capacity_tier: 'small',
      website: null,
      bio: 'A small congregation that prioritizes prayer support and personal relationships with the missionaries it partners with.',
      missions_focus: null,
      contact_name: 'Sam Okonkwo',
      contact_role: 'Elder',
      hosts_short_term_trips: false,
      sends_teams: false,
      hosts_furloughs: false
    },
    tagIds: ['credobaptist', 'congregational_polity']
  }
];

async function ensureUser(email) {
  const { data: existing, error: listError } = await supabase.auth.admin.listUsers({ perPage: 200 });
  if (listError) throw listError;
  const found = existing.users.find((u) => u.email === email);
  if (found) return { id: found.id, created: false };

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { seed: 'example-profile' }
  });
  if (error) throw error;
  return { id: data.user.id, created: true };
}

async function seedMissionary({ email, profile, tagIds }) {
  const { id, created } = await ensureUser(email);
  console.log(`  ${created ? 'created' : 'exists'}: ${email} (${id})`);

  const { error: profileError } = await supabase
    .from('missionary_profiles')
    .upsert({ id, status: 'approved', ...profile }, { onConflict: 'id' });
  if (profileError) throw profileError;

  await supabase.from('missionary_doctrinal_tags').delete().eq('missionary_id', id);
  if (tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from('missionary_doctrinal_tags')
      .insert(tagIds.map((tag_id) => ({ missionary_id: id, tag_id })));
    if (tagError) throw tagError;
  }
}

async function seedChurch({ email, profile, tagIds }) {
  const { id, created } = await ensureUser(email);
  console.log(`  ${created ? 'created' : 'exists'}: ${email} (${id})`);

  const { error: profileError } = await supabase
    .from('church_profiles')
    .upsert({ id, status: 'approved', ...profile }, { onConflict: 'id' });
  if (profileError) throw profileError;

  await supabase.from('church_doctrinal_tags').delete().eq('church_id', id);
  if (tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from('church_doctrinal_tags')
      .insert(tagIds.map((tag_id) => ({ church_id: id, tag_id })));
    if (tagError) throw tagError;
  }
}

async function main() {
  console.log('Seeding example missionary profiles…');
  for (const m of MISSIONARIES) await seedMissionary(m);

  console.log('Seeding example church profiles…');
  for (const c of CHURCHES) await seedChurch(c);

  console.log('Done. Requires the church_profiles_public_read_approved and');
  console.log('church_tags_read policy updates in supabase/schema.sql to be');
  console.log('applied for /for-missionaries to actually see these.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
