import React, { useId, useState } from 'react';
import { m } from 'framer-motion';
import SpotlightOverlay from './SpotlightOverlay.jsx';
import useJsonLd from '../hooks/useJsonLd.js';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

// Real, honest Q&A about how this specific site works — no invented stats
// or claims, just a plain description of what's actually built.
const ITEMS = [
  {
    q: 'Is Fielded affiliated with any of the agencies it lists?',
    a: "No. Fielded doesn't receive any benefit from, and isn't affiliated with, any sending agency shown in the quiz results. The matcher scores agencies against their own public information, not a paid placement."
  },
  {
    q: 'Where does the map data come from?',
    a: 'Every people group on the map comes from Joshua Project, refreshed on a weekly schedule via an automated pipeline. Nothing on the map is hand-entered or estimated by this site.'
  },
  {
    q: "What happens if an agency's site doesn't say something?",
    a: 'The matcher never guesses. If an agency\'s public materials don\'t clearly state something — their support-raising model, for example — that shows up under "worth asking about" as an open question, not as a confirmed fact.'
  },
  {
    q: 'Is this a replacement for talking to a real recruiter?',
    a: "No. It's a starting point — a way to walk into that first conversation with an agency already knowing what you have in common and what to ask about."
  }
];

function FaqItem({ item, index }) {
  const [open, setOpen] = useState(false);
  const prefersReduced = usePrefersReducedMotion();
  // useId (not index-based) so the id/aria-controls pairing stays unique and
  // stable even if items are ever reordered or filtered.
  const panelId = useId();
  return (
    // Its own settle-into-place reveal (opacity + a slight scale, no
    // vertical rise) rather than RevealOnScroll's shared fade-and-rise —
    // deliberately calmer/slower, since this is reference content someone
    // is about to read closely, not a card being scanned past.
    <m.div
      className="faq-item-wrapper"
      data-reveal
      initial={prefersReduced ? false : { opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="faq-item">
        <button
          className="faq-question"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
        >
          <span className="faq-question-text">
            <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
            {item.q}
          </span>
          <span className="faq-toggle">{open ? '−' : '+'}</span>
        </button>
        {/* Always rendered (not mounted/unmounted) — grid-template-rows
            0fr→1fr is a pure-CSS way to animate to an unknown/auto content
            height without JS-measuring it, more robust than animating a
            motion.div to height:'auto'. */}
        <div id={panelId} className={`faq-answer-wrap${open ? ' faq-answer-wrap--open' : ''}`}>
          <div className="faq-answer-inner">
            <p className="faq-answer">{item.a}</p>
          </div>
        </div>
      </div>
    </m.div>
  );
}

// Structured data straight from the same ITEMS array rendered above — no
// separate copy to drift out of sync, and nothing here says anything the
// visible FAQ doesn't already say.
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a }
  }))
};

export default function Faq() {
  useJsonLd('faq', faqSchema);
  return (
    <section className="faq">
      <SpotlightOverlay />
      <div className="faq-inner">
        <h2>Questions worth answering up front</h2>
        <div className="faq-list">
          {ITEMS.map((item, i) => (
            <FaqItem key={item.q} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
