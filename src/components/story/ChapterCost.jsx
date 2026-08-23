import React from 'react';
import { m } from 'framer-motion';
import Photo from '../Photo.jsx';
import { SCRIPTURE } from '../../data/scripture.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

const PUNCH_LINES = [
  'Language you’ll stumble through for years.',
  'Distance from the people who raised you.',
  'A support budget that depends on other people’s generosity, every month, indefinitely.',
  'Kids who grow up between cultures, belonging fully to neither.',
  'Seasons with no visible fruit at all.',
  'And still — go.'
];

export default function ChapterCost() {
  const prefersReduced = usePrefersReducedMotion();
  const { cost } = SCRIPTURE;

  return (
    <section className="chapter chapter-cost">
      <div className="chapter-kicker">Chapter IV — The Cost</div>
      <Photo
        variant="v-night"
        caption="A missionary family at a departure gate, or a commissioning service — real photo pending"
      />
      <div className="cost-punch">
        {PUNCH_LINES.map((line, i) => (
          <m.p
            key={line}
            className={i === PUNCH_LINES.length - 1 ? 'cost-punch-turn' : undefined}
            initial={prefersReduced ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: i * 0.15, ease: EASE }}
          >
            {line}
          </m.p>
        ))}
      </div>
      <m.blockquote
        className="cost-scripture"
        initial={prefersReduced ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.8, ease: EASE }}
      >
        {cost.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <cite>{cost.reference} (ESV)</cite>
      </m.blockquote>
    </section>
  );
}
