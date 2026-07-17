import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import RevealOnScroll from './RevealOnScroll.jsx';
import MapPreviewGraphic from './MapPreviewGraphic.jsx';
import useMagnetic from '../hooks/useMagnetic.js';

export default function MapTeaser() {
  const ctaMagnetic = useMagnetic();

  return (
    <RevealOnScroll className="map-teaser">
      <div className="map-teaser-visual">
        <MapPreviewGraphic />
      </div>
      <div className="map-teaser-content">
        <h2>See where the need is</h2>
        <p>Explore an interactive map of unreached and under-resourced people groups worldwide.</p>
        <motion.span ref={ctaMagnetic.ref} style={ctaMagnetic.style} className="magnetic-wrap">
          <Link to="/map" className="cta-button">Explore the full map</Link>
        </motion.span>
      </div>
    </RevealOnScroll>
  );
}
