#!/usr/bin/env node

// Generates a small, static preview of the real people-groups map for the
// homepage's MapTeaser section — that section used to be text-and-a-button
// with no visual at all, the flattest spot on the homepage. Rather than
// shipping the full 16k-feature/3.7MB geojson (or fabricating placeholder
// dots), this samples real coordinates + real progressStatus at build time,
// same convention as generate-hero-dots.js, and writes a compact JSON that
// MapTeaser statically imports (no runtime fetch, no homepage weight).
//
// Usage: node scripts/generate-map-preview.js (run after fetch-jp populates
// public/data/people-groups.geojson).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { project } from './generate-hero-dots.js';

const GEOJSON_PATH = path.resolve('public/data/people-groups.geojson');
const OUT_PATH = path.resolve('src/data/mapPreview.json');

// Same 800x400 equirectangular box as the hero atlas (see generate-hero-
// dots.js) — not required to match, but keeps every dot-matrix visual on
// the homepage geographically aligned.
const VIEW_W = 800;
const VIEW_H = 400;

// A deterministic, evenly-spread sample (not random) so the build output is
// stable across runs given the same source data. Sorting by longitude before
// striding spreads the sample across the whole map instead of clustering
// wherever the source array happens to list features first.
const TARGET_DOTS = 450;

export function sample(features, targetCount = TARGET_DOTS) {
  const sorted = [...features].sort(
    (a, b) => a.geometry.coordinates[0] - b.geometry.coordinates[0]
  );
  const stride = Math.max(1, Math.floor(sorted.length / targetCount));
  const dots = [];
  for (let i = 0; i < sorted.length && dots.length < targetCount; i += stride) {
    const f = sorted[i];
    const [lon, lat] = f.geometry.coordinates;
    const [x, y] = project(lon, lat);
    dots.push({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, s: f.properties.progressStatus });
  }
  return dots;
}

function main() {
  const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
  const dots = sample(geojson.features);

  const preview = { viewBox: `0 0 ${VIEW_W} ${VIEW_H}`, dots };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(preview));
  console.log(`Wrote ${dots.length} dots to ${OUT_PATH}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
