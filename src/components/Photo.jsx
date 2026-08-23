import React from 'react';
import { m } from 'framer-motion';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

// No photography pipeline exists yet (see spec_2.md principle 2) — every
// "photo" on the site is one of these four labeled placeholders, never a
// stock image standing in as if it were real. The caption is the actual
// shot list entry, so a placeholder reads as intentional design, not a
// broken image. variant picks the gradient treatment; nothing else about
// this component changes.
const VARIANTS = new Set(['v-day', 'v-portrait', 'v-aerial', 'v-night']);

export default function Photo({ variant, caption, className = '' }) {
  const prefersReduced = usePrefersReducedMotion();
  const v = VARIANTS.has(variant) ? variant : 'v-day';

  return (
    <m.figure
      className={`photo ${v} ${className}`.trim()}
      data-reveal
      initial={prefersReduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    >
      <m.div
        className="photo-img"
        initial={prefersReduced ? false : { scale: 1.12 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1] }}
      />
      {caption && <figcaption>{caption}</figcaption>}
    </m.figure>
  );
}
