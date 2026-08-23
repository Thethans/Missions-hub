import React from 'react';
import { m } from 'framer-motion';
import Photo from '../Photo.jsx';
import ChapterTitle from './ChapterTitle.jsx';
import { SCRIPTURE } from '../../data/scripture.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

const PUNCH_LINES = [
  'Language you’ll stumble through for years.',
  'Distance from the people who raised you.',
  'A support budget that depends on other people’s generosity, every month, indefinitely.',
  'Kids who grow up between cultures, belonging fully to neither.',
  'Seasons with no visible fruit at all.',
  'And still, go.'
];

export default function ChapterCost() {
  const prefersReduced = usePrefersReducedMotion();
  const { cost } = SCRIPTURE;

  return (
    <section className="chapter chapter-cost">
      <ChapterTitle number="IV" title="The Cost" />
      {/* A real, documented account, not an invented scene: on January 8,
          1956, Jim Elliot and four other missionaries (Nate Saint, Ed
          McCully, Roger Youderian, Pete Fleming) were killed by Waorani
          tribesmen in Ecuador while attempting first peaceful contact
          ("Operation Auca"). No real photo asset exists in this codebase
          yet (no image pipeline) — Photo.jsx's placeholder system stays,
          but the caption now names the actual person and event instead of
          a generic stand-in scene. Swap for a real, rights-cleared photo
          when one is sourced. */}
      <Photo
        variant="v-night"
        caption="Jim Elliot, one of five missionaries killed by Waorani tribesmen in Ecuador on January 8, 1956, while attempting first peaceful contact."
      />
      <p className="cost-account">
        Jim Elliot spent years building toward contact with the Waorani, an isolated people group in
        the Ecuadorian rainforest with no history of peaceful contact with outsiders. On January 8,
        1956, he and four other missionaries were speared to death on a riverbank shortly after that
        contact finally happened. He was 28.
      </p>
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
