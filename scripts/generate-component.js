#!/usr/bin/env node

// Reads all opportunities from Supabase and the Fielded design tokens, then
// generates OpportunitiesExplorer.jsx and a static fallback data file the
// component fetches at runtime.
//
// The opportunities list used to be inlined into OpportunitiesExplorer.jsx
// as a JS literal — with 1500+ records that made it ~650KB before gzip, by
// far the largest route chunk in the app, mostly for data that's only ever
// used as a fallback when Supabase itself is unreachable. It's now written
// to public/data/opportunities-fallback.json instead and fetched at
// runtime (same pattern as the world map's people-groups data), so the
// route's JS chunk stays small regardless of how large the dataset grows.
//
// Usage:
//   node scripts/generate-component.js

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TOKENS_PATH = path.join(ROOT, 'src/styles/tokens.css');
const TEMPLATE_PATH = path.join(ROOT, 'scripts/lib/OpportunitiesExplorer.template.jsx');
const OUTPUT_PATH = path.join(ROOT, 'src/components/OpportunitiesExplorer.jsx');
const FALLBACK_DATA_PATH = path.join(ROOT, 'public/data/opportunities-fallback.json');

// ── Supabase client ──────────────────────────────────────────────────

async function fetchOpportunities() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Missing SUPABASE_URL / VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(url, key);

  const allRows = [];
  const PAGE_SIZE = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('opportunities')
      .select('id, agency, title, url, location, region, role_type, term_length, description')
      .eq('active', true)
      .order('agency', { ascending: true })
      .order('title', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Supabase fetch failed:', error.message);
      process.exit(1);
    }

    allRows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
}

// ── Design tokens ────────────────────────────────────────────────────

function parseTokens() {
  const css = fs.readFileSync(TOKENS_PATH, 'utf-8');
  const tokens = {};
  for (const match of css.matchAll(/--([\w-]+)\s*:\s*([^;]+)/g)) {
    if (match[1].startsWith('topo')) continue;
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

// ── Component generation ─────────────────────────────────────────────

function generateComponent(opportunities, tokens) {
  const agencies = [...new Set(opportunities.map((o) => o.agency))].sort();
  const regions = [...new Set(opportunities.map((o) => o.region).filter(Boolean))].sort();
  const roleTypes = [...new Set(opportunities.map((o) => o.role_type).filter(Boolean))].sort();
  const termLengths = [...new Set(opportunities.map((o) => o.term_length).filter(Boolean))].sort(
    (a, b) => {
      const order = ['short-term', 'mid-term', 'career'];
      const ai = order.findIndex((p) => a.startsWith(p));
      const bi = order.findIndex((p) => b.startsWith(p));
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    }
  );

  const safeJson = (val) => JSON.stringify(val, null, 2);

  const tokenComment = Object.entries(tokens)
    .map(([k, v]) => '//   --' + k + ': ' + v)
    .join('\n');

  const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  return template
    .replace('/* __TOKEN_COMMENT__ */', tokenComment)
    .replace("'__GENERATED_DATE__'", JSON.stringify(new Date().toISOString()))
    .replace("'__OPP_COUNT__'", String(opportunities.length))
    .replace("'__AGENCY_COUNT__'", String(agencies.length))
    .replace("'__REGIONS__'", safeJson(regions))
    .replace("'__ROLE_TYPES__'", safeJson(roleTypes))
    .replace("'__TERM_LENGTHS__'", safeJson(termLengths));
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching opportunities from Supabase...');
  const opportunities = await fetchOpportunities();
  console.log('  ' + opportunities.length + ' active opportunities across ' + [...new Set(opportunities.map((o) => o.agency))].length + ' agencies');

  if (opportunities.length === 0) {
    console.error('No opportunities found — run "npm run sync-opportunities" first');
    process.exit(1);
  }

  console.log('Reading design tokens from src/styles/tokens.css...');
  const tokens = parseTokens();
  console.log('  ' + Object.keys(tokens).length + ' tokens parsed');

  console.log('Generating OpportunitiesExplorer.jsx...');
  const component = generateComponent(opportunities, tokens);

  fs.writeFileSync(OUTPUT_PATH, component, 'utf-8');
  console.log('  Written to ' + path.relative(ROOT, OUTPUT_PATH));

  // Compact (no pretty-printing) — this ships to the browser as-is.
  fs.writeFileSync(FALLBACK_DATA_PATH, JSON.stringify(opportunities), 'utf-8');
  console.log('  Written to ' + path.relative(ROOT, FALLBACK_DATA_PATH) +
    ' (' + (fs.statSync(FALLBACK_DATA_PATH).size / 1024).toFixed(1) + ' KB)');

  console.log('Done.');
}

main();
