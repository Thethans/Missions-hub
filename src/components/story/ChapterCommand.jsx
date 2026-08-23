import React from 'react';
import { m } from 'framer-motion';
import { SCRIPTURE } from '../../data/scripture.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

export default function ChapterCommand() {
  const prefersReduced = usePrefersReducedMotion();
  const { command, staircase } = SCRIPTURE;

  return (
    <section className="chapter chapter-command">
      <div className="chapter-kicker">Chapter I — The Command</div>
      <div className="command-grid">
        <div className="command-scripture">
          <blockquote>
            {command.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <cite>{command.reference} (ESV)</cite>
          </blockquote>
        </div>
        <div className="command-staircase">
          {staircase.lines.map((line, i) => (
            <m.p
              key={line}
              className={`staircase-line${i === staircase.lines.length - 1 ? ' staircase-line--sent' : ''}`}
              style={{ marginLeft: `${i * 1.5}rem` }}
              initial={prefersReduced ? false : { opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.6, delay: i * 0.18, ease: EASE }}
            >
              {line}
            </m.p>
          ))}
          <p className="staircase-source">{staircase.reference} (ESV)</p>
        </div>
      </div>
    </section>
  );
}
