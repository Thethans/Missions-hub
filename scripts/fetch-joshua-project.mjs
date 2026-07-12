// Pulls people-group data from the Joshua Project API and writes it as
// GeoJSON that the map component reads directly (no live API calls from
// the browser, so no key is ever exposed client-side).
//
// Requires env var JP_API_KEY (get one free at https://joshuaproject.net/api/register)
//
// Run manually:   JP_API_KEY=xxxx npm run fetch-jp
// Run on schedule: see .github/workflows/update-data.yml

import fs from 'fs';
import path from 'path';

const API_KEY = process.env.JP_API_KEY;
if (!API_KEY) {
  console.error('Missing JP_API_KEY env var. Get one free at https://joshuaproject.net/api/register');
  process.exit(1);
}

const BASE = 'https://api.joshuaproject.net/v1/people_groups.json';
const OUT_PATH = path.resolve('public/data/people-groups.geojson');
const STATS_PATH = path.resolve('public/data/stats.json');

function progressStatus(pctEvangelical) {
  if (pctEvangelical >= 5) return 'reached';
  if (pctEvangelical >= 2) return 'formative';
  return 'unreached';
}

// Trim lat/lon to 6 decimal places (~0.1m precision at equator, more than
// enough for a world map at zoom 1.4). Saves ~11% on gzipped size.
function roundCoord(value) {
  return Math.round(value * 1000000) / 1000000;
}

// The full dataset is ~16,400 people-group-by-country records — comfortably
// under one request at this limit. If a future refresh ever comes back with
// exactly LIMIT rows, that's a sign the real count has grown past it and
// this needs to go up (or turn into real pagination) rather than silently
// truncating again like the old limit=2000 did.
const LIMIT = 25000;

async function main() {
  const url = `${BASE}?api_key=${API_KEY}&limit=${LIMIT}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Joshua Project API request failed: ${res.status} ${res.statusText}`);
  }
  const rows = await res.json();
  if (rows.length === LIMIT) {
    console.warn(`Got exactly LIMIT (${LIMIT}) rows back — the real dataset may be larger than this fetch captured. Raise LIMIT.`);
  }

  const features = rows
    .filter((r) => r.Latitude && r.Longitude)
    .map((r) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [roundCoord(Number(r.Longitude)), roundCoord(Number(r.Latitude))] },
      properties: {
        name: r.PeopNameInCountry || r.PeopleGroupName,
        country: r.Ctry,
        population: Number(r.Population) || 0,
        pctEvangelical: Number(r.PercentEvangelical) || 0,
        religion: r.PrimaryReligion,
        progressStatus: progressStatus(Number(r.PercentEvangelical) || 0)
      }
    }));

  const geojson = { type: 'FeatureCollection', features };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(geojson));
  console.log(`Wrote ${features.length} people groups to ${OUT_PATH}`);

  // The homepage stats strip only needs these three aggregate numbers, not
  // all ~16k raw features — precompute them here so it can fetch a
  // kilobyte-sized file instead of parsing the full multi-megabyte geojson.
  const unreached = features.filter((f) => f.properties.progressStatus === 'unreached');
  const stats = {
    unreachedGroups: unreached.length,
    unreachedPopulation: unreached.reduce((sum, f) => sum + (f.properties.population || 0), 0),
    unreachedCountries: new Set(unreached.map((f) => f.properties.country)).size
  };
  fs.writeFileSync(STATS_PATH, JSON.stringify(stats));
  console.log(`Wrote stats to ${STATS_PATH}:`, stats);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
