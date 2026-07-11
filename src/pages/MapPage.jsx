import React, { useState } from 'react';
import WorldMap from '../components/WorldMap.jsx';
import MapDetailPanel from '../components/MapDetailPanel.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

export default function MapPage() {
  const [selected, setSelected] = useState(null);
  usePageMeta({
    title: 'World Map',
    description: 'Interactive map of unreached people groups worldwide, with live data from Joshua Project.',
    path: '/map'
  });

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
      </section>
      <div className="page-map">
        <WorldMap selected={selected} onSelect={setSelected} />
      </div>
      <MapDetailPanel selected={selected} />
    </>
  );
}
