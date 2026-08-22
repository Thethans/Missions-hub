import React from 'react';
import { Quotes } from '@phosphor-icons/react';
import RevealOnScroll from './RevealOnScroll.jsx';

// spec_1.md calls for "a single named testimonial" — no real one exists
// yet, and inventing a quote with a fabricated name/role would be exactly
// the kind of fake social proof CLAUDE.md rules out for stats, so this
// renders an explicitly-labeled reserved slot instead (same idea as the
// spec's own photo placeholder panels: "each caption is the actual shot
// list", intentional-looking, not broken). Swap for a real <blockquote>
// once an agency partner gives one.
export default function PartnerQuotePlaceholder() {
  return (
    <RevealOnScroll className="partner-quote-placeholder" variant="settle">
      <Quotes size={28} weight="fill" aria-hidden="true" />
      <p className="partner-quote-placeholder-label">Reserved for a partner testimonial</p>
      <p className="partner-quote-placeholder-note">
        A named quote from an agency partner or sending church goes here once one exists —
        not a placeholder written to sound like one.
      </p>
    </RevealOnScroll>
  );
}
