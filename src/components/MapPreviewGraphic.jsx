import React from 'react';
import mapPreview from '../data/mapPreview.json';

// Same 30°-lat/lon graticule idea as WorldMap.jsx's buildGraticule(), redrawn
// as plain SVG lines instead of a GeoJSON source (there's no MapLibre canvas
// here). The projection generate-map-preview.js uses (equirectangular, see
// generate-hero-dots.js's project()) maps lon/lat to x/y linearly, so evenly
// spaced lines across the 800x400 viewBox line up with real 30° meridians/
// parallels without needing to run that projection here too. Purely
// decorative structure — without it, 1,400 dots with no coastline or border
// reference read as a sparse scatter rather than a map.
const VIEW_W = 800;
const VIEW_H = 400;
const GRID_STEP_X = VIEW_W / 12; // 360° / 30°
const GRID_STEP_Y = VIEW_H / 8; // ~134° visible lat range / ~30°

function Graticule() {
  const verticals = [];
  for (let x = 0; x <= VIEW_W; x += GRID_STEP_X) verticals.push(x);
  const horizontals = [];
  for (let y = 0; y <= VIEW_H; y += GRID_STEP_Y) horizontals.push(y);
  return (
    <g className="map-preview-graticule" aria-hidden="true">
      {verticals.map((x) => (
        <line key={`v${x}`} x1={x} y1={0} x2={x} y2={VIEW_H} />
      ))}
      {horizontals.map((y) => (
        <line key={`h${y}`} x1={0} y1={y} x2={VIEW_W} y2={y} />
      ))}
    </g>
  );
}

// A static preview of the real people-groups map for the homepage's
// MapTeaser section — every dot is a real, sampled coordinate + real
// progressStatus (see scripts/generate-map-preview.js), not a fabricated
// illustration. Same solid/faded/ring status encoding as the live map (see
// WorldMap.jsx CIRCLE_FILL_OPACITY) so it reads consistently once a visitor
// reaches /map.
export default function MapPreviewGraphic() {
  return (
    <svg
      className="map-preview-graphic"
      viewBox={mapPreview.viewBox}
      role="img"
      aria-label="Preview of the world map, showing real unreached, formative, and reached people-group locations"
    >
      <Graticule />
      {mapPreview.dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={2.2} className={`map-preview-dot status-${d.s}`} />
      ))}
    </svg>
  );
}
