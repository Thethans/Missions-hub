import React from 'react';
import { m } from 'framer-motion';
import ChapterTitle from './ChapterTitle.jsx';
import { SCRIPTURE } from '../../data/scripture.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

// A symbolic answer to Chapter II's abyss field, not a real map or a
// literal statistic — deliberately abstract (a plain grid, not real
// coordinates) so it can't be mistaken for measured data the way the real
// map/stats numbers elsewhere on the site are. ~82% lit is an artistic
// rendering of Revelation 5:9's vision, captioned as such below.
const COLS = 24;
const ROWS = 14;
const DOTS = Array.from({ length: COLS * ROWS }, (_, i) => {
  const seed = Math.sin(i * 17.31) * 43758.5453;
  const frac = seed - Math.floor(seed);
  return { i, lit: frac < 0.82 };
});

export default function ChapterEnding() {
  const prefersReduced = usePrefersReducedMotion();
  const { ending } = SCRIPTURE;

  return (
    <section className="chapter chapter-ending">
      <ChapterTitle number="V" title="The Ending" />
      <m.blockquote
        className="ending-scripture"
        initial={prefersReduced ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {ending.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <cite>{ending.reference} (ESV)</cite>
      </m.blockquote>

      <m.div
        className="ending-map"
        initial={prefersReduced ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.1, ease: EASE }}
      >
        {/* A label before the graphic, not just a trailing caption after it
            — an abstract dot grid with no on-image legend read as
            unexplained on first look; naming it up front (and tying it
            explicitly to Chapter II's own field, same dot colors reused on
            purpose) does the explaining before the reader has to wonder. */}
        <p className="ending-map-label">Chapter II's darkness, answered</p>
        <svg viewBox={`0 0 ${COLS} ${ROWS}`} role="img" aria-label="A symbolic grid, mostly lit in warm gold, representing Revelation's vision of every nation reached — not real map data">
          {DOTS.map((d) => (
            <circle
              key={d.i}
              cx={(d.i % COLS) + 0.5}
              cy={Math.floor(d.i / COLS) + 0.5}
              r={0.32}
              className={d.lit ? 'ending-dot ending-dot--lit' : 'ending-dot'}
            />
          ))}
        </svg>
        <p className="ending-map-caption">
          Not a measurement of where things stand today — a picture of the promise Revelation makes:
          every tribe, language, people, and nation, reached.
        </p>
      </m.div>
    </section>
  );
}
