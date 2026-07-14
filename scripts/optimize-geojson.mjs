// Optimizes people-groups.geojson: trims coordinate precision, and (only for
// line/polygon data — see below) can simplify geometry using mapshaper.
//
// Usage: node scripts/optimize-geojson.mjs [--simplify]
// --simplify applies geometry simplification (requires mapshaper binary)
//
// IMPORTANT: this dataset is 100% Point features (one dot per people group).
// Mapshaper's `-simplify` (Douglas-Peucker) reduces the number of *vertices
// along a line/polygon*; a single point has no intermediate vertices to
// remove, so running it against this file is a no-op — main() below detects
// that and skips the mapshaper pass with an explanation rather than silently
// "succeeding" at nothing.
//
// Most of this file's actual weight is the low-cardinality string properties
// (progressStatus/religion/country — as few as 3-10 distinct values, repeated
// across all ~16k features) rather than geometry. Dictionary-encoding those
// into a lookup table would cut raw size by ~35%, but only ~5-8% *after*
// gzip/brotli (measured) — compression already captures most of that
// redundancy — which didn't seem worth the risk of touching every consumer
// that reads these as named string properties (WorldMap.jsx's MapLibre
// filter/paint expressions, MapPopupCard.jsx, MapDetailPanel.jsx) for a
// single-digit-percent transfer-size win on an already-route-scoped fetch.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import zlib from 'zlib';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.resolve(__dirname, '../public/data/people-groups.geojson');

// 4 decimal places (~11m at the equator) — this map never zooms in past a
// whole-country view (flyTo caps at zoom 3.5), so sub-meter precision from
// the original 6-decimal source data is pure waste; 11m is still far tighter
// than a single pixel represents at any zoom this app actually uses.
function roundCoord(value) {
  return Math.round(value * 10000) / 10000;
}

function isPointOnlyDataset(geojson) {
  return geojson.features.every((f) => f.geometry.type === 'Point');
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
  reportSizes('After trimming to 4 decimals (~11m precision)', trimmed);

  let optimized = trimmed;

  // Step 2: Optional simplification — only meaningful for line/polygon data.
  if (doSimplify && isPointOnlyDataset(original)) {
    console.log(
      '\n⏭️  Skipping --simplify: every feature here is a Point, and mapshaper\'s' +
        '\n   simplify only removes vertices from lines/polygons. Running it against' +
        '\n   point geometry is a no-op — see the file header for where the real size' +
        '\n   (repeated low-cardinality string properties) actually goes.'
    );
  } else if (doSimplify) {
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
