import React from 'react';

const ITEMS = [
  { status: 'unreached', label: 'Unreached' },
  { status: 'formative', label: 'Formative' },
  { status: 'reached', label: 'Reached' }
];

export default function MapLegend({
  counts,
  active,
  onToggle,
  religions,
  religionCounts,
  religionActive,
  onToggleReligion
}) {
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
      {religions && religions.length > 0 && (
        <div className="map-legend-religion">
          <span className="map-legend-religion-label">
            Religion
            {religionActive.size > 0 && (
              <span className="map-legend-religion-label-count">{religionActive.size}</span>
            )}
          </span>
          <div className="map-legend-religion-chips">
            {religions.map((religion) => {
              const isActive = religionActive.has(religion);
              return (
                <button
                  key={religion}
                  type="button"
                  className={`map-legend-religion-chip${isActive ? ' map-legend-religion-chip--active' : ''}`}
                  onClick={() => onToggleReligion && onToggleReligion(religion)}
                  aria-pressed={isActive}
                >
                  {religion}
                  <span className="map-legend-religion-chip-count">{religionCounts[religion] ?? 0}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
