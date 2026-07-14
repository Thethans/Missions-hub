import React, { useState, useRef, useEffect } from 'react';
import WorldMap from '../components/WorldMap.jsx';
import MapAccessibleSearch from '../components/MapAccessibleSearch.jsx';
import MapDetailPanel from '../components/MapDetailPanel.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

export default function MapPage() {
  const [selected, setSelected] = useState(null);
  const [features, setFeatures] = useState(null);
  const detailRef = useRef(null);
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
        <WorldMap selected={selected} onSelect={setSelected} onDataLoaded={setFeatures} />
      </div>
      <div ref={detailRef}>
        <MapDetailPanel selected={selected} />
      </div>
    </>
  );
}
