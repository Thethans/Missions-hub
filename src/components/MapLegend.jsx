import React, { useId } from 'react';
import RELIGION_SUMMARIES from '../data/religionSummaries.js';

const ITEMS = [
  { status: 'unreached', label: 'Unreached' },
  { status: 'formative', label: 'Formative' },
  { status: 'reached', label: 'Reached' }
];

// Split out so useId() (needed for a stable aria-describedby target) can
// be called once per chip, not once per array item inside a .map() in the
// parent — hooks can't live inside a loop callback.
function ReligionChip({ religion, isActive, count, onClick }) {
  const tooltipId = useId();
  const summary = RELIGION_SUMMARIES[religion];
  return (
    <span className="map-legend-religion-chip-wrap">
      <button
        type="button"
        className={`map-legend-religion-chip${isActive ? ' map-legend-religion-chip--active' : ''}`}
        onClick={onClick}
        aria-pressed={isActive}
        aria-describedby={summary ? tooltipId : undefined}
      >
        {religion}
        <span className="map-legend-religion-chip-count">{count}</span>
      </button>
      {summary && (
        <span role="tooltip" id={tooltipId} className="map-legend-religion-tooltip">
          {summary}
        </span>
      )}
    </span>
  );
}

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
            {religions.map((religion) => (
              <ReligionChip
                key={religion}
                religion={religion}
                isActive={religionActive.has(religion)}
                count={religionCounts[religion] ?? 0}
                onClick={() => onToggleReligion && onToggleReligion(religion)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
