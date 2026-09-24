import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Funnel, X } from '@phosphor-icons/react';
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
  // Below ~640px the always-open corner panel would cover most of the map
  // (see the mobile rules in styles.css), so it becomes a closed-by-default
  // bottom sheet opened by this toggle instead. Above that breakpoint the
  // toggle/overlay/mobile header are all hidden by CSS and .map-legend
  // renders exactly as it always has, regardless of this state.
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen]);

  return (
    <>
      <button
        type="button"
        className="map-legend-mobile-toggle"
        onClick={() => setMobileOpen(true)}
        aria-expanded={mobileOpen}
        aria-controls="map-legend-panel"
      >
        <Funnel size={16} weight="bold" />
        Filters
      </button>
      {mobileOpen && (
        <div className="map-legend-overlay" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
      <div
        className={`map-legend${mobileOpen ? ' map-legend--sheet-open' : ''}`}
        id="map-legend-panel"
      >
        <div className="map-legend-mobile-header">
          <span className="map-legend-mobile-title">Filters</span>
          <button
            type="button"
            className="map-legend-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close filters"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
        {/* counts is null only until the geojson tally resolves (see
            WorldMap.jsx) — most real visits skip this entirely, since
            counts/religions are seeded from the prerendered snapshot's
            preloaded data (src/utils/preloadedData.js). A shimmering
            placeholder in the count's own slot reads as "this number is
            coming" rather than the swatches/labels looking finished while
            silently missing data. */}
        {counts === null && (
          <p className="visually-hidden" role="status">Loading unreached-group counts&hellip;</p>
        )}
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
              {counts ? (
                <span className="map-legend-count">{counts[item.status] ?? 0}</span>
              ) : (
                <span className="map-legend-count-skeleton" aria-hidden="true" />
              )}
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
    </>
  );
}
