#!/usr/bin/env node

// Generates country-outline SVG path data for the homepage's MapTeaser
// preview (src/components/MapPreviewGraphic.jsx) — that graphic previously
// had only a lat/lon graticule and dots, no coastline/border reference (see
// the comment on generate-hero-dots.js explaining why a coastline dataset
// was deliberately left out of that earlier pass). Revisited here at the
// user's request: world-atlas's countries-110m (a standard, public-domain,
// ~110m-resolution Natural Earth simplification, ~108KB) is a devDependency
// used only by this Node script — never imported by any browser-bundled
// file — so it adds nothing to the client bundle. The *output* of this
// script (a single flattened SVG path string) is what actually ships.
//
// Usage: node scripts/generate-map-outlines.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { feature } from 'topojson-client';
import countries110m from 'world-atlas/countries-110m.json' with { type: 'json' };
import { project } from './generate-hero-dots.js';

const OUT_PATH = path.resolve('src/data/mapOutlines.json');

// Same 800x400 box the dots use (see generate-hero-dots.js's project()),
// so outlines and dots land in the same coordinate space with no separate
// alignment step.
const VIEW_W = 800;
const VIEW_H = 400;

// project() clamps latitude to [-58, 76] (see generate-hero-dots.js) — real
// people-group coordinates barely exist outside that band. Antarctica sits
// entirely below it, so instead of flattening into a smeared band along the
// bottom edge, skip any ring that's almost entirely below -58.
const ANTARCTICA_LAT_CUTOFF = -55;

// A naive per-point projection of a ring that crosses the antimeridian
// (±180° longitude — Russia and Fiji both do in this dataset) draws one
// long spurious line all the way across the view, since project() maps
// longitude linearly with no wraparound awareness. When consecutive points
// jump by more than half the view width, start a new subpath instead of
// connecting them — same practical fix any flat equirectangular renderer
// needs for antimeridian-crossing geometry.
// 110m-resolution coastline has far more points than a decorative 800x400
// graphic can show — most fall well under a pixel apart at this scale.
// Rounding to 1 decimal (same precision generate-map-preview.js uses for
// its dots) plus dropping points within half a pixel of the last kept one
// cuts the output from ~350KB to a fraction of that with no visible loss.
const MIN_PIXEL_GAP = 0.5;

function round(n) {
  return Math.round(n * 10) / 10;
}

function ringToPathSegment(ring) {
  const projected = ring.map(([lon, lat]) => project(lon, lat).map(round));
  const points = [];
  for (const [x, y] of projected) {
    const last = points[points.length - 1];
    if (last && Math.abs(x - last[0]) < MIN_PIXEL_GAP && Math.abs(y - last[1]) < MIN_PIXEL_GAP) continue;
    points.push([x, y]);
  }
  if (points.length < 3) return '';

  let d = '';
  points.forEach(([x, y], i) => {
    if (i === 0) {
      d += `M${x},${y}`;
      return;
    }
    const [prevX] = points[i - 1];
    if (Math.abs(x - prevX) > VIEW_W / 2) {
      d += `M${x},${y}`;
    } else {
      d += `L${x},${y}`;
    }
  });
  return d + 'Z';
}

function averageLat(ring) {
  return ring.reduce((sum, [, lat]) => sum + lat, 0) / ring.length;
}

function polygonToPath(coordinates) {
  // GeoJSON Polygon: array of rings ([lon,lat][])
  return coordinates
    .filter((ring) => averageLat(ring) > ANTARCTICA_LAT_CUTOFF)
    .map(ringToPathSegment)
    .filter(Boolean)
    .join(' ');
}

function geometryToPath(geometry) {
  if (geometry.type === 'Polygon') {
    return polygonToPath(geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map(polygonToPath).join(' ');
  }
  return '';
}

function main() {
  const geo = feature(countries110m, countries110m.objects.countries);
  const path_d = geo.features.map((f) => geometryToPath(f.geometry)).filter(Boolean).join(' ');

  const out = { viewBox: `0 0 ${VIEW_W} ${VIEW_H}`, path: path_d };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out));
  console.log(`Wrote outline path (${(path_d.length / 1024).toFixed(1)}KB of path data) to ${OUT_PATH}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
