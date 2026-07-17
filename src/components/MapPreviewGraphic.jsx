import React from 'react';
import mapPreview from '../data/mapPreview.json';

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
      {mapPreview.dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={2.6} className={`map-preview-dot status-${d.s}`} />
      ))}
    </svg>
  );
}
