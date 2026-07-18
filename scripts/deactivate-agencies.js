#!/usr/bin/env node

// Deactivates all opportunities from specified agencies in Supabase.
// Usage: node scripts/deactivate-agencies.js avant serge

import 'dotenv/config';

async function deactivateAgencies(agencyNames) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Missing SUPABASE_URL / VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key);

  for (const agencyName of agencyNames) {
    console.log(`Deactivating opportunities from ${agencyName}...`);
    const { data, error } = await supabase
      .from('opportunities')
      .update({ active: false })
      .ilike('agency', agencyName)
      .select('id, agency, title');

    if (error) {
      console.error(`  Error: ${error.message}`);
    } else {
      console.log(`  Deactivated ${data.length} opportunities`);
    }
  }
}

const agencies = process.argv.slice(2);
if (agencies.length === 0) {
  console.error('Usage: node scripts/deactivate-agencies.js <agency1> <agency2> ...');
  process.exit(1);
}

deactivateAgencies(agencies);
