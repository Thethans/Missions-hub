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
