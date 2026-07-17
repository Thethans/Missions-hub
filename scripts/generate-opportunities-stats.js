#!/usr/bin/env node

// Small derived stat file for the homepage's Capabilities section (the
// "opportunities explorer" card) — same static-import-not-runtime-fetch
// convention as src/data/stats.json and src/data/mapPreview.json, computed
// from the same public/data/opportunities-fallback.json snapshot that
// OpportunitiesExplorer.jsx itself is generated against (see the "// Opportunities:
// N across M agencies" comment scripts/generate-component.js writes into
// that file), so the two numbers never drift apart.
//
// Usage: node scripts/generate-opportunities-stats.js (run after
// scripts/sync-opportunities.js refreshes the fallback snapshot).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const FALLBACK_PATH = path.resolve('public/data/opportunities-fallback.json');
const OUT_PATH = path.resolve('src/data/opportunitiesStats.json');

export function computeStats(opportunities) {
  const agencies = new Set(opportunities.map((o) => o.agency));
  return { count: opportunities.length, agencyCount: agencies.size };
}

function main() {
  const opportunities = JSON.parse(fs.readFileSync(FALLBACK_PATH, 'utf8'));
  const stats = computeStats(opportunities);

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(stats));
  console.log(`Wrote ${stats.count} opportunities across ${stats.agencyCount} agencies to ${OUT_PATH}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
