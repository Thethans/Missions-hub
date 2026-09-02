import React from 'react';
import { m } from 'framer-motion';
import statsData from '../../data/stats.json';
import VariableBloom from './VariableBloom.jsx';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

export default function ColdOpen() {
  const prefersReduced = usePrefersReducedMotion();
  const population = (statsData.unreachedPopulation / 1e9).toFixed(1);

  return (
    <section className="cold-open">
      <div className="cold-open-particles" aria-hidden="true" />
      <m.div
        className="cold-open-content"
        initial={prefersReduced ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        // amount: 0 (not 0.6) — the hero above is now deliberately shorter
        // than the viewport (see .hero's own comment in styles.css) so a
        // slice of this section is visible, cut off, before any scroll
        // happens, as a "there's more below" cue. A 0.6 threshold kept
        // that whole peeked slice invisible until the reader had already
        // scrolled most of the way past it — defeating the cue entirely.
        viewport={{ once: true, amount: 0 }}
        transition={{ duration: 1, ease: EASE }}
      >
        <VariableBloom className="cold-open-number" variant="numeral">{population}B</VariableBloom>
        <p>People alive right now who have no path to hear the gospel in their own language and culture.</p>
        <p>This is where they are. This is who is meant to reach them.</p>
      </m.div>
    </section>
  );
}
