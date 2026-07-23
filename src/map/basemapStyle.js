// Local MapLibre style JSON, built against the free demotiles.maplibre.org
// vector tile source (no API key, no new tile-hosting dependency) but with
// our own paint properties instead of their default palette. Style JSON
// can't consume CSS custom properties, so these hexes are copies of the
// tokens defined in src/styles/tokens.css — keep the two in sync manually
// if the palette changes.
//
// Source-layer names ("countries", "centroids") verified directly against
// https://demotiles.maplibre.org/style.json and tiles.json.

const TILE_SOURCE_URL = 'https://demotiles.maplibre.org/tiles/tiles.json';

const OCEAN = '#1e3151'; // lighter navy tint than --ink-navy, for readability under markers
const LAND = '#ede7d9'; // muted atlas-paper-adjacent tone, darker than --atlas-paper for contrast
const HAIRLINE = 'rgba(22, 35, 59, 0.35)'; // muted --ink-navy tint
const LABEL = 'rgba(22, 35, 59, 0.75)';
const LABEL_HALO = '#faf7f0'; // --atlas-paper, for label legibility over land/ocean

const basemapStyle = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    // Attribution kept explicit here since we hand-build this style rather than
    // fetching demotiles' own style.json (which carries it, if blank, upstream) —
    // MapLibre's default AttributionControl reads this straight off the source.
    maplibre: {
      type: 'vector',
      url: TILE_SOURCE_URL,
      attribution: '© <a href="https://maplibre.org/" target="_blank" rel="noreferrer">MapLibre</a>'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': OCEAN }
    },
    {
      id: 'countries-fill',
      type: 'fill',
      source: 'maplibre',
      'source-layer': 'countries',
      paint: { 'fill-color': LAND }
    },
    {
      id: 'countries-boundary',
      type: 'line',
      source: 'maplibre',
      'source-layer': 'countries',
      paint: { 'line-color': HAIRLINE, 'line-width': 0.5 }
    },
    {
      id: 'countries-label',
      type: 'symbol',
      source: 'maplibre',
      'source-layer': 'centroids',
      minzoom: 3,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Open Sans Semibold'],
        'text-size': 11
      },
      paint: {
        'text-color': LABEL,
        'text-halo-color': LABEL_HALO,
        'text-halo-width': 1
      }
    }
  ]
};

export default basemapStyle;
