import React from 'react';
import { motion } from 'framer-motion';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

export default function RevealOnScroll({ children, index = 0, className }) {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <motion.div
      className={className}
      // data-reveal: pure-CSS safety net (see styles.css) that forces this
      // element visible if JS never runs/hydrates — see the "SCROLL-REVEAL
      // SAFETY NET" section there for why.
      data-reveal
      // initial={false} under reduced motion (rather than opacity:0 that a
      // whileInView transition would resolve) so the content is never
      // dependent on an IntersectionObserver callback actually firing to
      // become visible — same defensive pattern as JourneySection.jsx.
      initial={prefersReduced ? false : { opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      {children}
    </motion.div>
  );
}
