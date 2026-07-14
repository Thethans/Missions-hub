import React, { useMemo, useState } from 'react';

const MAX_RESULTS = 20;

// A fully keyboard-operable alternative to clicking a point on the map
// canvas. MapLibre's WebGL canvas has no native keyboard/focus path, and
// with 16,000+ points a one-tab-stop-per-marker approach wouldn't be usable
// anyway — a filtered list of ordinary <button> results is standards-based
// (Tab/Enter/Space just work, no custom ARIA choreography to get wrong) and
// gives keyboard and screen-reader users the same "select a people group and
// see its profile" outcome a mouse click gives everyone else.
export default function MapAccessibleSearch({ features, onSelect }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || !features) return [];
    const matches = [];
    for (let i = 0; i < features.length; i++) {
      const props = features[i].properties;
      if (props.name?.toLowerCase().includes(q) || props.country?.toLowerCase().includes(q)) {
        matches.push({ index: i, feature: features[i] });
        if (matches.length >= MAX_RESULTS) break;
      }
    }
    return matches;
  }, [query, features]);

  function selectResult({ index, feature }) {
    onSelect({ ...feature.properties, coordinates: feature.geometry.coordinates, id: index });
    setQuery('');
  }

  return (
    <div className="map-search">
      <label htmlFor="map-search-input" className="map-search-label">
        Search people groups by name or country
      </label>
      <input
        id="map-search-input"
        type="search"
        className="map-search-input"
        placeholder="e.g. “Amri” or “Sudan”"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={!features}
      />
      {query.trim() && (
        <div className="map-search-results" role="region" aria-label="Search results">
          {results.length === 0 ? (
            <p className="map-search-empty">No matches.</p>
          ) : (
            <ul className="map-search-list">
              {results.map(({ index, feature }) => (
                <li key={index}>
                  <button
                    type="button"
                    className="map-search-result"
                    onClick={() => selectResult({ index, feature })}
                  >
                    <span className={`map-search-result-dot status-${feature.properties.progressStatus}`} />
                    <span className="map-search-result-name">{feature.properties.name}</span>
                    <span className="map-search-result-country">{feature.properties.country}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
