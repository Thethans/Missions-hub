import React from 'react';
import { m } from 'framer-motion';
import { SCRIPTURE } from '../../data/scripture.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

export default function ChapterPattern() {
  const prefersReduced = usePrefersReducedMotion();
  const { pattern } = SCRIPTURE;

  return (
    <section className="chapter chapter-pattern">
      <div className="chapter-kicker">Chapter III — The Pattern</div>
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
        <p>
          Notice who did the sending. Not Barnabas and Saul, deciding on their own that the moment
          felt right. Not an agency, identifying talent and issuing a commission. A gathered,
          worshiping, fasting local church — the ordinary kind, meeting in one place — laid hands on
          two of its own and sent them out.
        </p>
        <p>
          That's a different shape than the one most people default to. The common picture of
          missions is an individual with a calling: someone senses a burden, researches a country,
          finds an agency, raises support, and goes — largely alone, with a church cheering from a
          distance and writing checks. It isn't wrong to have a calling. It's incomplete to carry it
          by yourself.
        </p>
        <p>
          The pattern in Acts runs the other direction. The church is the sender, not the sponsor. It
          doesn't outsource the work of discernment to an agency and the work of support to a
          newsletter; it lays its own hands on its own people and sends them, staying attached the
          whole way — spiritually, relationally, financially — the way a body stays attached to a
          limb it has sent forward.
        </p>
        <p>
          Agencies still matter. Most churches don't have the on-the-ground infrastructure, language
          training, or field experience to place and support someone alone, and a good agency brings
          exactly that. But the agency should be the vehicle a sending church chooses, not a
          replacement for having one. Fielded exists to make that first step — a church and a
          candidate actually finding each other — less scattered than it currently is.
        </p>
      </m.div>
    </section>
  );
}
