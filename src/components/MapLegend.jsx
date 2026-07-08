import React from 'react';

const ITEMS = [
  { status: 'unreached', label: 'Unreached' },
  { status: 'formative', label: 'Formative' },
  { status: 'reached', label: 'Reached' }
];

export default function MapLegend() {
  return (
    <div className="map-legend">
      {ITEMS.map((item) => (
        <div className="map-legend-item" key={item.status}>
          <span className={`map-legend-swatch status-${item.status}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
