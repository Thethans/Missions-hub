import React from 'react';
import WorldMap from '../components/WorldMap.jsx';

export default function MapPage() {
  return (
    <>
      <section className="page-hero page-hero--compact">
        <h1>The world map</h1>
        <p>
          Every point is a real people group from{' '}
          <a href="https://joshuaproject.net" target="_blank" rel="noreferrer">Joshua Project</a>,
          colored by progress status — red for unreached, gold for formative, green for reached.
          Circle size reflects population. Click a point for details.
        </p>
      </section>
      <div className="page-map">
        <WorldMap />
      </div>
    </>
  );
}
