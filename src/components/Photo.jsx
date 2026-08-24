import React from 'react';
import { m } from 'framer-motion';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

// No photography pipeline exists yet (see spec_2.md principle 2) — most
// "photo" spots on the site are still one of these four labeled gradient
// placeholders, never a stock image standing in as if it were real. Where a
// real, rights-cleared photo has been sourced, pass src/alt and it renders
// in place of the gradient (variant is ignored then, since there's nothing
// left for it to color). The caption is the actual shot list entry either
// way, so a placeholder reads as intentional design, not a broken image.
const VARIANTS = new Set(['v-day', 'v-portrait', 'v-aerial', 'v-night']);

export default function Photo({ variant, caption, src, alt, className = '' }) {
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
      >
        {src && <img src={src} alt={alt || ''} className="photo-real-img" />}
      </m.div>
      {caption && <figcaption>{caption}</figcaption>}
    </m.figure>
  );
}
