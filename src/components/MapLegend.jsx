import React, { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import RELIGION_SUMMARIES from '../data/religionSummaries.js';

const ITEMS = [
  { status: 'unreached', label: 'Unreached' },
  { status: 'formative', label: 'Formative' },
  { status: 'reached', label: 'Reached' }
];

// Split out so useId() (needed for a stable aria-describedby target) can
// be called once per chip, not once per array item inside a .map() in the
// parent — hooks can't live inside a loop callback.
//
// The tooltip itself is portaled to document.body and positioned from the
// chip's own getBoundingClientRect(): the legend panel needs overflow-y:auto
// to scroll its own contents, and a CSS-clipped ancestor was cutting the
// tooltip off before it could show its full text. Portaling escapes that
// clipping entirely. Because a portaled node is no longer a DOM descendant
// of the chip, CSS :hover/:focus-within can't reach it — visibility is
// tracked in state and driven by the same mouse/focus events instead.
function ReligionChip({ religion, isActive, count, onClick }) {
  const tooltipId = useId();
  const summary = RELIGION_SUMMARIES[religion];
  const chipRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const show = () => {
    if (!chipRef.current) return;
    const rect = chipRef.current.getBoundingClientRect();
    setCoords({ top: rect.top, left: rect.left + rect.width / 2 });
    setOpen(true);
  };
  const hide = () => setOpen(false);

  return (
    <span className="map-legend-religion-chip-wrap">
      <button
        ref={chipRef}
        type="button"
        className={`map-legend-religion-chip${isActive ? ' map-legend-religion-chip--active' : ''}`}
        onClick={onClick}
        onMouseEnter={summary ? show : undefined}
        onMouseLeave={summary ? hide : undefined}
        onFocus={summary ? show : undefined}
        onBlur={summary ? hide : undefined}
        aria-pressed={isActive}
        aria-describedby={summary ? tooltipId : undefined}
      >
        {religion}
        <span className="map-legend-religion-chip-count">{count}</span>
      </button>
      {summary &&
        createPortal(
          <span
            role="tooltip"
            id={tooltipId}
            className={`map-legend-religion-tooltip${open ? ' map-legend-religion-tooltip--visible' : ''}`}
            style={{ top: coords.top, left: coords.left }}
          >
            {summary}
          </span>,
          document.body
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
