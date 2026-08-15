import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import MapPreviewGraphic from './MapPreviewGraphic.jsx';
import useMagnetic from '../hooks/useMagnetic.js';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

export default function MapTeaser() {
  const ctaMagnetic = useMagnetic();
  const prefersReduced = usePrefersReducedMotion();

  return (
    // Full-bleed visual (no bounding card, no max-width) instead of the
    // rounded/shadowed panel every other section's centered container uses
    // — the map runs to the true edge of the viewport, with the copy
    // holding a fixed column against it rather than the two sharing an
    // evenly-split, evenly-margined grid.
    <section className="map-teaser">
      <m.div
        className="map-teaser-visual"
        data-reveal
        initial={prefersReduced ? false : { opacity: 0, scale: 1.04 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.9, ease: EASE }}
      >
        <MapPreviewGraphic />
      </m.div>
      <m.div
        className="map-teaser-content"
        data-reveal
        initial={prefersReduced ? false : { opacity: 0, x: 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
      >
        <h2>See where the need is</h2>
        <p>Explore an interactive map of unreached and under-resourced people groups worldwide.</p>
        <m.span ref={ctaMagnetic.ref} style={ctaMagnetic.style} className="magnetic-wrap">
          <Link to="/map" className="cta-button">Explore the full map</Link>
        </m.span>
      </m.div>
    </section>
  );
}
