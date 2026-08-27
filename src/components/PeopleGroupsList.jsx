import React, { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlass, CaretLeft, CaretRight, X } from '@phosphor-icons/react';
import { formatPopulation } from '../lib/format.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';

const DATA_URL = '/data/people-groups.geojson';
const PAGE_SIZE = 24;

const STATUS_LABEL = {
  unreached: 'Unreached',
  formative: 'Formative',
  reached: 'Reached'
};

// Independent fetch rather than sharing WorldMap's already-loaded features:
// this view needs to work without ever mounting WorldMap (and its maplibre-gl
// dependency) at all, so a visitor who only wants the list doesn't pay for
// the map bundle. The browser's HTTP cache makes a second fetch of the same
// URL effectively free if both views get used in one session.
function usePeopleGroupsData() {
  const [features, setFeatures] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(DATA_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        // Same "array index is the stable id" contract WorldMap.jsx bakes
        // onto each feature — keeps a selection made here valid if the
        // visitor switches to Map view afterward.
        data.features.forEach((f, i) => { f.id = i; });
        setFeatures(data.features);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('Could not load people-groups.geojson', e);
        setError(true);
      });
    return () => { cancelled = true; };
  }, []);

  return { features, error };
}

function PeopleGroupCard({ feature, onSelect }) {
  const p = feature.properties;
  const statusLabel = STATUS_LABEL[p.progressStatus] || p.progressStatus;
  return (
    <article className="pgl-card">
      <button type="button" className="pgl-card-select" onClick={() => onSelect(feature)}>
        <header className="pgl-card-header">
          <span className={`pgl-card-status-dot status-${p.progressStatus}`} aria-hidden="true" />
          <span className="pgl-card-status-label">{statusLabel}</span>
        </header>
        <h3 className="pgl-card-name">{p.name}</h3>
        <p className="pgl-card-meta">
          {p.country}
          {p.religion ? ` · ${p.religion}` : ''}
        </p>
        <p className="pgl-card-population">{formatPopulation(p.population)} people</p>
      </button>
    </article>
  );
}

export default function PeopleGroupsList({ onSelect }) {
  const { features, error } = usePeopleGroupsData();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 200);
  const [countryFilter, setCountryFilter] = useState('');
  const [religionFilter, setReligionFilter] = useState('');
  const [page, setPage] = useState(1);

  const { countries, religions } = useMemo(() => {
    if (!features) return { countries: [], religions: [] };
    const countryTally = new Map();
    const religionTally = new Map();
    for (const f of features) {
      const { country, religion } = f.properties;
      if (country) countryTally.set(country, (countryTally.get(country) || 0) + 1);
      if (religion) religionTally.set(religion, (religionTally.get(religion) || 0) + 1);
    }
    // Most-represented first, same convention as WorldMap's own religion
    // list — reads as "the real major categories in this dataset" instead
    // of an alphabetical dump.
    const byCountThenName = (tally) =>
      [...tally.keys()].sort((a, b) => tally.get(b) - tally.get(a) || a.localeCompare(b));
    return { countries: byCountThenName(countryTally), religions: byCountThenName(religionTally) };
  }, [features]);

  const filtered = useMemo(() => {
    if (!features) return [];
    const q = debouncedQuery.trim().toLowerCase();
    return features.filter((f) => {
      const p = f.properties;
      if (countryFilter && p.country !== countryFilter) return false;
      if (religionFilter && p.religion !== religionFilter) return false;
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) ||
        p.country?.toLowerCase().includes(q) ||
        p.religion?.toLowerCase().includes(q)
      );
    });
  }, [features, debouncedQuery, countryFilter, religionFilter]);

  // Any filter/search change invalidates whatever page we were on.
  useEffect(() => { setPage(1); }, [debouncedQuery, countryFilter, religionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  const hasActiveFilters = Boolean(query || countryFilter || religionFilter);
  const clearFilters = () => {
    setQuery('');
    setCountryFilter('');
    setReligionFilter('');
  };

  if (error) {
    return (
      <div className="pgl-error" role="alert">
        <p>Couldn't load people-group data right now — try refreshing the page.</p>
      </div>
    );
  }

  if (!features) {
    return (
      <div className="pgl-loading" role="status">
        <p className="visually-hidden">Loading people groups…</p>
        <div className="pgl-grid" aria-hidden="true">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div className="pgl-card-skeleton" key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pgl">
      <div className="pgl-controls">
        <div className="pgl-search-wrap">
          <MagnifyingGlass size={18} weight="bold" aria-hidden="true" className="pgl-search-icon" />
          <label htmlFor="pgl-search-input" className="visually-hidden">
            Search people groups by name, country, or religion
          </label>
          <input
            id="pgl-search-input"
            type="search"
            className="pgl-search-input"
            placeholder="Search by name, country, or religion…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="pgl-filter-row">
          <label className="pgl-filter">
            <span className="visually-hidden">Filter by country</span>
            <select
              className="pgl-filter-select"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            >
              <option value="">All countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="pgl-filter">
            <span className="visually-hidden">Filter by religion</span>
            <select
              className="pgl-filter-select"
              value={religionFilter}
              onChange={(e) => setReligionFilter(e.target.value)}
            >
              <option value="">All religions</option>
              {religions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
          {hasActiveFilters && (
            <button type="button" className="pgl-clear-filters" onClick={clearFilters}>
              <X size={14} weight="bold" /> Clear filters
            </button>
          )}
        </div>
      </div>

      <p className="pgl-results-count" aria-live="polite">
        {filtered.length.toLocaleString()} {filtered.length === 1 ? 'people group' : 'people groups'}
        {hasActiveFilters ? ' matching your filters' : ''}
      </p>

      {filtered.length === 0 ? (
        <div className="pgl-empty" role="status">
          <p>No people groups match your current search and filters.</p>
          {hasActiveFilters && (
            <button type="button" className="cta-button" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="pgl-grid">
            {pageItems.map((f) => (
              <PeopleGroupCard key={f.id} feature={f} onSelect={onSelect} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="pgl-pagination" aria-label="People groups pages">
              <button
                type="button"
                className="pgl-page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <CaretLeft size={16} weight="bold" /> Previous
              </button>
              <span className="pgl-page-status">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="pgl-page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next <CaretRight size={16} weight="bold" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
