#!/usr/bin/env node

// One-off pass of the P1-C sanitize pipeline (scripts/lib/sanitize.js) over
// every existing row in the `opportunities` table. Run once after applying
// the migration in supabase/schema.sql (description_full/listing_type/
// stale_flag/merged_titles columns), then re-run any time you want to
// re-clean the whole table — it's idempotent, same as the pipeline itself.
//
// Usage:
//   node scripts/backfill-sanitize.js --dryRun   # preview only, no writes
//   node scripts/backfill-sanitize.js            # write for real
//
// Near-dupe collapse never deletes rows — a merged variant is soft-deleted
// via `active: false` (same pattern the sync script already uses for stale
// listings), so nothing here is irreversible.

import 'dotenv/config';
import { supabase } from './lib/supabase-client.js';
import { sanitizeOpportunities } from './lib/sanitize.js';

const PAGE_SIZE = 1000;

async function fetchAllOpportunities() {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

async function run() {
  const dryRun = process.argv.includes('--dryRun');

  console.log('Fetching existing opportunities…');
  const rows = await fetchAllOpportunities();
  console.log(`Fetched ${rows.length} rows.`);

  const { opportunities: sanitized, categoryReassignments } = sanitizeOpportunities(rows);

  const keptIds = new Set(sanitized.map((o) => o.id));
  const mergedIds = rows.filter((r) => !keptIds.has(r.id)).map((r) => r.id);

  console.log(`Near-dupe collapse: ${mergedIds.length} row(s) will be merged into a canonical record.`);
  console.log(`Category reassignments: ${categoryReassignments.length}`);
  for (const r of categoryReassignments.slice(0, 25)) {
    console.log(`  [${r.agency}] "${r.title}": ${r.from} → ${r.to}`);
  }
  if (categoryReassignments.length > 25) {
    console.log(`  … and ${categoryReassignments.length - 25} more`);
  }

  if (dryRun) {
    console.log('\nDry run — no writes performed.');
    return;
  }

  let updated = 0;
  let failed = 0;
  for (const opp of sanitized) {
    const { error } = await supabase
      .from('opportunities')
      .update({
        description: opp.description,
        description_full: opp.description_full,
        role_type: opp.role_type,
        listing_type: opp.listing_type,
        stale_flag: opp.stale_flag,
        merged_titles: opp.merged_titles
      })
      .eq('id', opp.id);
    if (error) {
      console.error(`Failed to update ${opp.id} (${opp.title}):`, error.message);
      failed += 1;
    } else {
      updated += 1;
    }
  }

  if (mergedIds.length > 0) {
    const { error } = await supabase
      .from('opportunities')
      .update({ active: false })
      .in('id', mergedIds);
    if (error) console.error('Failed to deactivate merged near-dupe rows:', error.message);
  }

  console.log(`\nUpdated ${updated} rows${failed > 0 ? `, ${failed} failed` : ''}.`);
  console.log(`Deactivated ${mergedIds.length} merged near-dupe rows.`);
  console.log('Backfill complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
