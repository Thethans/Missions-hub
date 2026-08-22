import React from 'react';
import { m } from 'framer-motion';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

// Three motion shapes, not one recipe stamped on every block regardless of
// what it is — 'rise' is the original list/card entrance (opportunity
// cards, quiz results, numbered steps: content that's genuinely a
// sequence). 'fade' drops the y-offset for prose (About page sections
// aren't a list, so they don't need a "row sliding into place" motion).
// 'settle' is a slight scale-in for standalone panels (a CTA block isn't a
// list item either), echoing the same scale motif Faq.jsx already uses for
// its own items rather than inventing a fourth unrelated shape.
const VARIANTS = {
  rise: { opacity: 0, y: 8 },
  fade: { opacity: 0 },
  settle: { opacity: 0, scale: 0.98 }
};

export default function RevealOnScroll({ children, index = 0, className, variant = 'rise' }) {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <m.div
      className={className}
      // data-reveal: pure-CSS safety net (see styles.css) that forces this
      // element visible if JS never runs/hydrates — see the "SCROLL-REVEAL
      // SAFETY NET" section there for why.
      data-reveal
      // initial={false} under reduced motion (rather than opacity:0 that a
      // whileInView transition would resolve) so the content is never
      // dependent on an IntersectionObserver callback actually firing to
      // become visible — same defensive pattern as JourneySection.jsx.
      initial={prefersReduced ? false : VARIANTS[variant]}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      {children}
    </m.div>
  );
}
