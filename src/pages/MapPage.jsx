import React, { useState, useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapTrifold, ListBullets } from '@phosphor-icons/react';
import MapAccessibleSearch from '../components/MapAccessibleSearch.jsx';
import MapDetailPanel from '../components/MapDetailPanel.jsx';
import PeopleGroupsList from '../components/PeopleGroupsList.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

// Lazy, separate from the MapPage route chunk: WorldMap pulls in maplibre-gl
// (the heaviest dependency in the app), and bundling it inline meant the
// whole route chunk had to finish evaluating — maplibre included — before
// React could paint even the static hero heading/paragraph above it.
// Lighthouse traced ~4.4s of LCP "element render delay" to exactly this.
// Splitting it into its own chunk lets the hero text and search box paint
// immediately while the map streams in behind its own loading state.
const WorldMap = lazy(() => import('../components/WorldMap.jsx'));

// Same rotation every visitor gets this week (not per-visitor random), so
// it reads as "this week's featured group" rather than a flickery reload
// lottery — and it's stable enough to reason about/link to. Index into
// `features` is what WorldMap.jsx bakes onto each feature as `id` before
// splitting them across its per-religion sources, so this lines up with a
// real map click on the same point regardless of which religion it's in.
function weekOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date - start) / (7 * 24 * 60 * 60 * 1000));
}

export default function MapPage() {
  const [selected, setSelected] = useState(null);
  const [features, setFeatures] = useState(null);
  const [view, setView] = useState('map');
  const detailRef = useRef(null);

  // A person clicking a list card gets the same shape MapAccessibleSearch/
  // WorldMap already produce for onSelect — { ...properties, coordinates,
  // id } — so MapDetailPanel below needs no changes to handle either
  // origin, and a selection made in List view stays valid if the visitor
  // switches to Map view afterward (same array-index id contract).
  function selectFromList(feature) {
    setSelected({ ...feature.properties, coordinates: feature.geometry.coordinates, id: feature.id });
  }

  // Read once on mount — lets the quiz's "see where they are" link
  // (/map?religion=Islam,Christianity) land pre-filtered, the same
  // read-once-as-initial-state pattern OpportunitiesExplorer uses for its
  // own URL-driven filters.
  const [searchParams] = useSearchParams();
  const initialReligions = useMemo(() => {
    const raw = searchParams.get('religion');
    return raw ? raw.split(',').filter(Boolean) : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featured = useMemo(() => {
    if (!features || features.length === 0) return null;
    const idx = weekOfYear(new Date()) % features.length;
    const feature = features[idx];
    return { ...feature.properties, coordinates: feature.geometry.coordinates, id: idx };
  }, [features]);
  usePageMeta({
    title: 'World Map',
    description: 'Interactive map of unreached people groups worldwide, with live data from Joshua Project.',
    path: '/map'
  });

  // When a point is clicked, glide the page down to the profile below so the
  // report is front and center — offsetting for the sticky nav so its header
  // isn't tucked underneath. Only on select (not on close).
  useEffect(() => {
    if (!selected || !detailRef.current) return;
    const nav = document.querySelector('.site-nav');
    const navHeight = nav ? nav.offsetHeight : 0;
    const top = detailRef.current.getBoundingClientRect().top + window.scrollY - navHeight - 16;
    window.scrollTo({ top, behavior: 'smooth' });
  }, [selected]);

  return (
    <>
      <section className="page-hero page-hero--compact map-hero">
        <h1>The world map</h1>
        <p>
          Every point is a real people group from{' '}
          <a href="https://joshuaproject.net" target="_blank" rel="noreferrer">Joshua Project</a>,
          colored by progress status. Click a point for details, or use the legend to filter.
        </p>
        <div className="map-view-toggle" role="group" aria-label="Choose a view">
          <button
            type="button"
            className={`map-view-toggle-btn${view === 'map' ? ' map-view-toggle-btn--active' : ''}`}
            aria-pressed={view === 'map'}
            onClick={() => setView('map')}
          >
            <MapTrifold size={16} weight="bold" /> Map view
          </button>
          <button
            type="button"
            className={`map-view-toggle-btn${view === 'list' ? ' map-view-toggle-btn--active' : ''}`}
            aria-pressed={view === 'list'}
            onClick={() => setView('list')}
          >
            <ListBullets size={16} weight="bold" /> List view
          </button>
        </div>
        {/* PeopleGroupsList has its own name/country/religion search built
            in, so this header search — tied to WorldMap's loaded features —
            only makes sense while the map itself is mounted. */}
        {view === 'map' && <MapAccessibleSearch features={features} onSelect={setSelected} />}
      </section>
      {view === 'map' ? (
        <div className="page-map">
          <Suspense fallback={<p className="map-loading" role="status">Loading map&hellip;</p>}>
            <WorldMap
              selected={selected}
              onSelect={setSelected}
              onDataLoaded={setFeatures}
              initialReligions={initialReligions}
            />
          </Suspense>
        </div>
      ) : (
        <div className="page-map-list">
          <PeopleGroupsList onSelect={selectFromList} />
        </div>
      )}
      <div ref={detailRef}>
        <MapDetailPanel selected={selected} featured={featured} onExploreFeatured={setSelected} />
      </div>
    </>
  );
}
