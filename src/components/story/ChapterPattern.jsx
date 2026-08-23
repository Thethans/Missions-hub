import React from 'react';
import { m } from 'framer-motion';
import ChapterTitle from './ChapterTitle.jsx';
import { SCRIPTURE } from '../../data/scripture.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

export default function ChapterPattern() {
  const prefersReduced = usePrefersReducedMotion();
  const { pattern } = SCRIPTURE;

  return (
    <section className="chapter chapter-pattern">
      <ChapterTitle number="III" title="The Pattern" />
      <m.blockquote
        className="pattern-scripture"
        initial={prefersReduced ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        {pattern.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <cite>{pattern.reference} (ESV)</cite>
      </m.blockquote>

      <m.div
        className="pattern-body"
        initial={prefersReduced ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
      >
        <p className="pattern-lede">
          Notice who did the sending: not an individual deciding alone, not an agency issuing a
          commission, but a gathered, worshiping local church.
        </p>

        <div className="pattern-compare">
          <div className="pattern-compare-col">
            <p className="pattern-compare-label">The common picture</p>
            <ol>
              <li>Someone senses a calling</li>
              <li>Researches, finds an agency</li>
              <li>Raises support, goes alone</li>
              <li>Church cheers from a distance</li>
            </ol>
          </div>
          <div className="pattern-compare-div" aria-hidden="true">
            <span>→</span>
          </div>
          <div className="pattern-compare-col pattern-compare-col--acts">
            <p className="pattern-compare-label">The pattern in Acts</p>
            <ol>
              <li>A gathered, worshiping church discerns</li>
              <li>It lays hands on its own, sends them</li>
              <li>An agency is the vehicle it chooses</li>
              <li>The church stays attached the whole way</li>
            </ol>
          </div>
        </div>

        <p className="pattern-close">
          Agencies still matter. Fielded exists to make that first connection, a church and a
          candidate finding each other, less scattered than it is today.
        </p>
      </m.div>
    </section>
  );
}
