import React, { useEffect, useRef } from 'react';
import { formatPopulation } from '../lib/format.js';

const STATUS_LABEL = {
  unreached: 'Unreached',
  formative: 'Formative',
  reached: 'Reached'
};

export default function MapPopupCard({ properties, onClose }) {
  const closeRef = useRef(null);
  const cardRef = useRef(null);

  // Move focus into the card the moment it appears — the primary path to
  // opening it is now keyboard-driven (MapAccessibleSearch), so a keyboard
  // user's focus needs to land somewhere inside it rather than staying on
  // the search result button that just got removed from the DOM.
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  // Escape closes (as before); Tab/Shift+Tab now wraps focus at the card's
  // own edges instead of escaping into TopNav/the rest of the page behind
  // it — role="dialog" plus aria-modal="true" without an actual focus trap
  // tells assistive tech one thing and lets sighted keyboard users do
  // another (same fix already applied to OpportunitiesExplorer's
  // InquiryModal; this card just hadn't gotten it yet).
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const focusable = cardRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
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
    <div className="map-popup-card" role="dialog" aria-modal="true" aria-label={`${properties.name} profile`} ref={cardRef}>
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
