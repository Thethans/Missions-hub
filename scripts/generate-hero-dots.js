#!/usr/bin/env node

// Generates the homepage hero's "Living Atlas" dot-matrix map (HERO section
// of FIELDED_PROFESSIONALIZATION_AUDIT.md) — a build-time-only computation,
// never done in the browser, writing a static coordinate array to
// src/data/heroAtlas.json that src/components/HeroBackground.jsx imports
// directly (same static-import pattern as src/data/stats.json).
//
// The spec's implementation note calls for "rasterizing a land-mass GeoJSON
// onto an equirectangular grid" — this repo doesn't bundle a coastline/land-
// polygon dataset, and fetching one or parsing real GeoJSON polygons would
// mean a new dependency (point-in-polygon, TopoJSON, etc.), which the pass
// this belongs to explicitly disallows. Instead this rasterizes the site's
// own real people-group coordinates (public/data/people-groups.geojson, the
// same Joshua Project pull WorldMap.jsx already renders) onto that grid —
// which the spec's own opening line actually asks for word for word ("a
// dot-matrix world map ... built from the site's own people-group data").
// Population-dense areas naturally trace recognizable continent shapes,
// and every dot is a real location, not an invented coastline.
//
// Usage: node scripts/generate-hero-dots.js (run after fetch-jp populates
// public/data/people-groups.geojson; wired into the same data-refresh step).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const GEOJSON_PATH = path.resolve('public/data/people-groups.geojson');
const OUT_PATH = path.resolve('src/data/heroAtlas.json');

// Equirectangular projection box. Latitude is capped to [-58, 76] — real
// people-group coordinates barely exist south of Tierra del Fuego or north
// of the Arctic Circle, so the fuller [-90, 90] range would just waste
// vertical space on empty ocean/ice.
const VIEW_W = 800;
const VIEW_H = 400;
const LAT_MIN = -58;
const LAT_MAX = 76;

export function project(lon, lat) {
  const x = ((lon + 180) / 360) * VIEW_W;
  const clampedLat = Math.max(LAT_MIN, Math.min(LAT_MAX, lat));
  const y = ((LAT_MAX - clampedLat) / (LAT_MAX - LAT_MIN)) * VIEW_H;
  return [x, y];
}

// Snaps real coordinates onto a grid, then dedupes — this is what turns
// 16,000+ individual points into a clean few-hundred-dot "matrix" texture
// instead of a speckled point cloud, while every remaining dot still
// traces back to at least one real location. Step size is searched so the
// final dot count lands in the spec's ~600-900 range regardless of exactly
// how many people-group records this particular Joshua Project pull has.
//
// Each cell optionally carries a real progressStatus tally (only when
// points are passed as [lon, lat, status] triples — the plain [lon, lat]
// form used by earlier tests still works and yields status-less dots) so
// the hero can color-code dots the same way the live map does, without
// inventing anything: a cell's status is whichever real progressStatus is
// most common among the actual people groups that landed in it.
function toDots(cells) {
  return [...cells.entries()].map(([key, statusCounts]) => {
    const [x, y] = key.split(',').map(Number);
    const dot = { x, y };
    if (statusCounts) {
      let best = null;
      let bestCount = -1;
      for (const [status, count] of statusCounts) {
        if (count > bestCount) { best = status; bestCount = count; }
      }
      dot.status = best;
    }
    return dot;
  });
}

export function rasterize(points, targetMin = 600, targetMax = 900) {
  if (points.length === 0) return [];

  let step = 4;
  let closest = null; // best-so-far cells, in case no attempt lands in range
  for (let attempt = 0; attempt < 40; attempt++) {
    const cells = new Map(); // key -> Map(status -> count), or null when no status given
    for (const [lon, lat, status] of points) {
      const [x, y] = project(lon, lat);
      const gx = Math.round(x / step) * step;
      const gy = Math.round(y / step) * step;
      const key = `${gx},${gy}`;
      if (status) {
        if (!cells.has(key)) cells.set(key, new Map());
        const statusCounts = cells.get(key);
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      } else if (!cells.has(key)) {
        cells.set(key, null);
      }
    }

    if (cells.size >= targetMin && cells.size <= targetMax) {
      return toDots(cells);
    }

    // Real source data (16k+ diverse coordinates) always finds a step that
    // lands in range well within 40 attempts. This fallback only matters
    // for degenerate/sparse inputs (e.g. a unit test with a handful of
    // distinct points) where no step can ever reach targetMin — closest
    // keeps whichever attempt had the most cells, so the result is "as many
    // real distinct positions as the data actually has" instead of empty.
    if (!closest || cells.size > closest.size) closest = cells;

    step = cells.size > targetMax ? step + 1 : Math.max(0.5, step - 0.5);
  }
  return toDots(closest);
}

// Real sending-hub cities (well-known real coordinates, not invented) paired
// with real unreached-people-group coordinates spread across longitude —
// see the module comment in HeroBackground.jsx for why longitude spread
// (not hand-picked countries) is used to choose the destinations: it's
// robust to whatever this particular Joshua Project pull actually contains.
const SENDING_CITIES = [
  { name: 'Chicago', lat: 41.8781, lon: -87.6298 },
  { name: 'Seoul', lat: 37.5665, lon: 126.978 },
  { name: 'London', lat: 51.5072, lon: -0.1276 }
];

export function formatCoord(lat, lon) {
  const latLabel = `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
  const lonLabel = `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;
  return `${latLabel} ${lonLabel}`;
}

export function buildRoutes(unreachedFeatures) {
  if (unreachedFeatures.length < SENDING_CITIES.length) return [];
  const sorted = [...unreachedFeatures].sort(
    (a, b) => a.geometry.coordinates[0] - b.geometry.coordinates[0]
  );
  const fractions = [0.15, 0.5, 0.85];

  return SENDING_CITIES.map((city, i) => {
    const idx = Math.min(sorted.length - 1, Math.floor(fractions[i] * sorted.length));
    const dest = sorted[idx];
    const [destLon, destLat] = dest.geometry.coordinates;
    const from = project(city.lon, city.lat);
    const to = project(destLon, destLat);
    // A quadratic-bezier bow rather than a literal orthodromic projection —
    // visually reads as a "sending arc" without spherical great-circle math
    // (which would need a projection library — see the "zero new
    // dependencies" constraint).
    const midX = (from[0] + to[0]) / 2;
    const midY = Math.min(from[1], to[1]) - 60;

    return {
      from: { x: from[0], y: from[1], label: `${city.name} — ${formatCoord(city.lat, city.lon)}` },
      to: { x: to[0], y: to[1], label: `${dest.properties.name} — ${formatCoord(destLat, destLon)}` },
      controlX: midX,
      controlY: midY
    };
  });
}

function main() {
  const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
  // The base dot-matrix (the texture that traces the continents) carries no
  // status — it's a plain, uncolored map, same as the original "Living
  // Atlas" — so this stays plain [lon, lat] pairs.
  const allPoints = geojson.features.map((f) => f.geometry.coordinates);
  const unreachedFeatures = geojson.features.filter((f) => f.properties.progressStatus === 'unreached');

  const dots = rasterize(allPoints);

  // ~14 real people groups per status, sampled evenly by longitude within
  // each status bucket (not randomly, so the build is stable run-to-run),
  // then interleaved round-robin across the three buckets rather than
  // concatenated. Real groups of the same status tend to sit in the same
  // region (a contiguous unreached belt, say), so a single list sorted by
  // longitude alone would still read as solid-colored blocks; interleaving
  // keeps every pulse a real, specific group while breaking that up into a
  // visually mixed, sporadic scatter of colors.
  const PULSES_PER_STATUS = 14;
  const statuses = ['unreached', 'formative', 'reached'];
  const byStatus = Object.fromEntries(statuses.map((status) => {
    const features = geojson.features.filter((f) => f.properties.progressStatus === status);
    const sorted = [...features].sort((a, b) => a.geometry.coordinates[0] - b.geometry.coordinates[0]);
    const strideLength = Math.max(1, Math.floor(sorted.length / PULSES_PER_STATUS));
    const sampled = [];
    for (let i = 0; i < sorted.length && sampled.length < PULSES_PER_STATUS; i += strideLength) {
      sampled.push(sorted[i]);
    }
    return [status, sampled];
  }));

  const pulses = [];
  for (let i = 0; i < PULSES_PER_STATUS; i++) {
    for (const status of statuses) {
      const feature = byStatus[status][i];
      if (!feature) continue;
      const [lon, lat] = feature.geometry.coordinates;
      const [x, y] = project(lon, lat);
      // Delay fraction (0..1) by longitude — animation-delay is computed
      // from this at render time so the pulse visibly travels west→east,
      // like time zones waking up, matching the spec's description exactly.
      const delayFraction = (lon + 180) / 360;
      pulses.push({ x, y, delayFraction, status });
    }
  }

  const routes = buildRoutes(unreachedFeatures);

  const atlas = { viewBox: `0 0 ${VIEW_W} ${VIEW_H}`, dots, pulses, routes };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(atlas));
  console.log(`Wrote ${dots.length} dots, ${pulses.length} pulses, ${routes.length} routes to ${OUT_PATH}`);
}

// Only run when executed directly (node scripts/generate-hero-dots.js) —
// not when the pure helper functions above are imported for unit tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
