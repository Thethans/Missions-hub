import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Fielded's mark is one letterform (the wordmark's own "F", Fraunces 600)
// plus one fixed accent — the ember dot — used two ways from the Atlas
// brand toolkit ("Fielded Logo Variations"):
//   - Monogram: the dot sits on the F like a diacritic (the app-icon mark).
//   - Wordmark: the "i" is set dotless (ı) and the same dot marks it instead.
// Both share a layoutId so toggling between them (see BrandLockup, used by
// TopNav's scroll-collapsed state) glides the dot across rather than
// cutting — "same dot ... never changes."
function EmberDot({ layoutId, variant, transition }) {
  return (
    <motion.span
      layoutId={layoutId}
      className={`brand-dot brand-dot--${variant}`}
      transition={transition ?? { type: 'spring', stiffness: 420, damping: 34 }}
    />
  );
}

const suffixMotion = {
  initial: { opacity: 0, x: -4 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.05 } },
  exit: { opacity: 0, x: -4, transition: { duration: 0.12 } }
};

// Animated nav lockup — collapses to the bare "F" monogram or expands to
// the full "Fielded" wordmark, with the ember dot sharing layout across
// both states via `layoutId`.
export default function BrandLockup({ expanded, layoutId = 'nav-brand-dot' }) {
  return (
    <span className="brand-lockup" aria-hidden="true">
      <span className="brand-lockup-f">F</span>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.span
            key="suffix"
            className="brand-lockup-suffix"
            variants={suffixMotion}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <span className="brand-lockup-i">ı</span>elded
          </motion.span>
        )}
      </AnimatePresence>
      <EmberDot layoutId={layoutId} variant={expanded ? 'wordmark' : 'monogram'} />
    </span>
  );
}
