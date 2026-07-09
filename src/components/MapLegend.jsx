import React from 'react';

const ITEMS = [
  { status: 'unreached', label: 'Unreached' },
  { status: 'formative', label: 'Formative' },
  { status: 'reached', label: 'Reached' }
];

export default function MapLegend({ counts, active, onToggle }) {
  return (
    <div className="map-legend">
      {ITEMS.map((item) => {
        const isActive = !active || active.has(item.status);
        return (
          <button
            key={item.status}
            type="button"
            className={`map-legend-item${isActive ? '' : ' map-legend-item--off'}`}
            onClick={() => onToggle && onToggle(item.status)}
            aria-pressed={isActive}
          >
            <span className={`map-legend-swatch status-${item.status}`} />
            {item.label}
            {counts && <span className="map-legend-count">{counts[item.status] ?? 0}</span>}
          </button>
        );
      })}
    </div>
  );
}
