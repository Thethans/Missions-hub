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

function progressStatus(pctEvangelical) {
  if (pctEvangelical >= 5) return 'reached';
  if (pctEvangelical >= 2) return 'formative';
  return 'unreached';
}

async function main() {
  // limit + fields kept modest for a first pass; expand as needed once
  // you've confirmed the pipeline works end-to-end
  const url = `${BASE}?api_key=${API_KEY}&limit=2000`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Joshua Project API request failed: ${res.status} ${res.statusText}`);
  }
  const rows = await res.json();

  const features = rows
    .filter((r) => r.Latitude && r.Longitude)
    .map((r) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [Number(r.Longitude), Number(r.Latitude)] },
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
