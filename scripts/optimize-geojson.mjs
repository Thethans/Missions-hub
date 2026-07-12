// Optimizes people-groups.geojson: trim coordinate precision and optionally
// simplify geometry using mapshaper. Safe for a global map at zoom 1.4.
//
// Usage: node scripts/optimize-geojson.mjs [--simplify]
// --simplify applies geometry simplification (requires mapshaper binary)

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import zlib from 'zlib';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.resolve(__dirname, '../public/data/people-groups.geojson');

function roundCoord(value) {
  return Math.round(value * 1000000) / 1000000;
}

function trimCoordinates(geojson) {
  return {
    ...geojson,
    features: geojson.features.map((feature) => ({
      ...feature,
      geometry: {
        ...feature.geometry,
        coordinates: feature.geometry.type === 'Point'
          ? [roundCoord(feature.geometry.coordinates[0]), roundCoord(feature.geometry.coordinates[1])]
          : feature.geometry.coordinates
      }
    }))
  };
}

async function simplifyWithMapshaper(geojsonPath) {
  const tmpPath = `${geojsonPath}.tmp`;
  const simplifyCmd = `mapshaper "${geojsonPath}" -simplify dp 0.1% -o format=geojson "${tmpPath}"`;

  try {
    await execAsync(simplifyCmd);
    const simplified = fs.readFileSync(tmpPath, 'utf8');
    fs.unlinkSync(tmpPath);
    return JSON.parse(simplified);
  } catch (e) {
    console.warn('⚠️  mapshaper not found or failed — skipping geometry simplification.');
    console.warn('   Install with: npm install -g mapshaper');
    return null;
  }
}

function reportSizes(label, data) {
  const json = JSON.stringify(data);
  const bytes = Buffer.byteLength(json);
  const gzipped = zlib.gzipSync(json).length;
  console.log(`${label}: ${(bytes / 1024).toFixed(2)} KB (raw) / ${(gzipped / 1024).toFixed(2)} KB (gzip)`);
}

async function main() {
  const args = process.argv.slice(2);
  const doSimplify = args.includes('--simplify');

  // Current state
  const original = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  console.log(`\n📊 Starting with ${original.features.length} features`);
  reportSizes('Before', original);

  // Step 1: Trim coordinates
  const trimmed = trimCoordinates(original);
  reportSizes('After trimming to 6 decimals', trimmed);

  let optimized = trimmed;

  // Step 2: Optional simplification
  if (doSimplify) {
    console.log('\n🗺️  Attempting geometry simplification with mapshaper...');
    const simplified = await simplifyWithMapshaper(DATA_PATH);
    if (simplified) {
      optimized = simplified;
      reportSizes('After mapshaper simplification', optimized);
      console.log(`Kept ${optimized.features.length} / ${original.features.length} features`);
    }
  } else {
    console.log('\n💡 Tip: Run with --simplify to evaluate mapshaper simplification');
  }

  // Write optimized version
  fs.writeFileSync(DATA_PATH, JSON.stringify(optimized));
  console.log(`\n✅ Optimized ${DATA_PATH}`);
  reportSizes('Final file', optimized);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
