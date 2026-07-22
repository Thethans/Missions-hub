import React, { useEffect, useRef } from 'react';
import { formatPopulation } from '../lib/format.js';

const STATUS_LABEL = {
  unreached: 'Unreached',
  formative: 'Formative',
  reached: 'Reached'
};

export default function MapPopupCard({ properties, onClose }) {
  const closeRef = useRef(null);

  // Move focus into the card the moment it appears — the primary path to
  // opening it is now keyboard-driven (MapAccessibleSearch), so a keyboard
  // user's focus needs to land somewhere inside it rather than staying on
  // the search result button that just got removed from the DOM.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Escape is the standard way to dismiss any dialog — this one had no
  // keyboard path to close it at all beyond tabbing to the ✕ button.
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Restore focus to the search input on close, rather than capturing
  // "whatever was previously focused": the search result button that
  // opened this is unmounted (query clears, collapsing the results list)
  // in the same React commit that mounts this card, so by the time any
  // effect here could read document.activeElement, it's already decayed to
  // <body> — there's nothing meaningful left to capture. The search input
  // is the next-most-sensible, always-present place for a keyboard user's
  // focus to land instead of being dropped to <body>.
  useEffect(() => {
    return () => {
      document.getElementById('map-search-input')?.focus();
    };
  }, []);

  return (
    <div className="map-popup-card" role="dialog" aria-label={`${properties.name} profile`}>
      <button ref={closeRef} className="map-popup-close" onClick={onClose} aria-label="Close">✕</button>
      <h3 className="map-popup-name">{properties.name}</h3>
      <p className="map-popup-meta">{properties.country} — {properties.religion}</p>
      <dl className="map-popup-stats">
        <div>
          <dt>Population</dt>
          <dd>{formatPopulation(properties.population)}</dd>
        </div>
        <div>
          <dt>% Evangelical</dt>
          <dd>{properties.pctEvangelical}%</dd>
        </div>
      </dl>
      <p className="map-popup-status">
        <span className={`map-popup-status-dot status-${properties.progressStatus}`} />
        {STATUS_LABEL[properties.progressStatus] || properties.progressStatus}
      </p>
    </div>
  );
}
