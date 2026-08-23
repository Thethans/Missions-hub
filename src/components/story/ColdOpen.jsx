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
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 1, ease: EASE }}
      >
        <VariableBloom className="cold-open-number" variant="numeral">{population}B</VariableBloom>
        <p>People alive right now who have no path to hear the gospel in their own language and culture.</p>
        <p>This is where they are, and who is meant to go.</p>
      </m.div>
    </section>
  );
}
