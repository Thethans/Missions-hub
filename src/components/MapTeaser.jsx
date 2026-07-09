import React from 'react';
import { Link } from 'react-router-dom';
import RevealOnScroll from './RevealOnScroll.jsx';

// The globe experience above (JourneySection) already carries "see where
// the need is" visually — this is just the closing pointer to the full map.
export default function MapTeaser() {
  return (
    <RevealOnScroll className="map-teaser">
      <h2>See where the need is</h2>
      <p>Explore an interactive map of unreached and under-resourced people groups worldwide.</p>
      <Link to="/map" className="cta-button">Explore the full map</Link>
    </RevealOnScroll>
  );
}
