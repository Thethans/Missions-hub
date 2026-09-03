// Dark basemap for the landing-page map preview (LandingMapPreview.jsx).
// Same free, keyless demotiles.maplibre.org vector source as basemapStyle.js
// — a real hillshade/terrain raster tileset would need a MapTiler/Mapbox API
// key, so this reaches for "dark desaturated terrain" the same way
// basemapStyle.js reaches for the light Atlas look: a hand-built style on
// top of country polygons, not real elevation data. The graticule layer
// (also reused from WorldMap.jsx's buildGraticule idea) is what stands in
// for "subtle contour texture" here.
//
// Source-layer names verified against https://demotiles.maplibre.org/style.json.

const TILE_SOURCE_URL = 'https://demotiles.maplibre.org/tiles/tiles.json';

const OCEAN = '#0f1826'; // darker than --ink-navy, so land reads as a lighter layer above it
const LAND = '#1e2c47'; // desaturated navy, a step up from OCEAN — no bright default vector-map land color
const HAIRLINE = 'rgba(250, 247, 240, 0.1)';
const LABEL = 'rgba(250, 247, 240, 0.55)';
const LABEL_HALO = 'rgba(15, 24, 38, 0.8)';

const darkTerrainStyle = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
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
      minzoom: 4,
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

export default darkTerrainStyle;
