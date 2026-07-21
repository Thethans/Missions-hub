import React, { useState, useRef, useEffect, useMemo, Suspense, lazy } from 'react';
import MapAccessibleSearch from '../components/MapAccessibleSearch.jsx';
import MapDetailPanel from '../components/MapDetailPanel.jsx';
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
// `features` (not feature.id) is what WorldMap's own generateId:true source
// assigns internally in this same array order, so this lines up with a real
// map click on the same point.
function weekOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.floor((date - start) / (7 * 24 * 60 * 60 * 1000));
}

export default function MapPage() {
  const [selected, setSelected] = useState(null);
  const [features, setFeatures] = useState(null);
  const detailRef = useRef(null);

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
      <section className="page-hero page-hero--compact">
        <h1>The world map</h1>
        <p>
          Every point is a real people group from{' '}
          <a href="https://joshuaproject.net" target="_blank" rel="noreferrer">Joshua Project</a>,
          colored by progress status — red for unreached, gold for formative, green for reached.
          Circle size reflects population. Click a point for details, or use the legend to filter.
        </p>
        <MapAccessibleSearch features={features} onSelect={setSelected} />
      </section>
      <div className="page-map">
        <Suspense fallback={<p className="map-loading" role="status">Loading map&hellip;</p>}>
          <WorldMap selected={selected} onSelect={setSelected} onDataLoaded={setFeatures} />
        </Suspense>
      </div>
      <div ref={detailRef}>
        <MapDetailPanel selected={selected} featured={featured} onExploreFeatured={setSelected} />
      </div>
    </>
  );
}
