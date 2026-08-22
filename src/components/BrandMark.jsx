import React from 'react';
import { m, AnimatePresence } from 'framer-motion';

// Fielded's mark: a route arcing from a small hollow "sending" ring to a
// solid, gently pulsing "field" dot — the same visual grammar as the hero's
// Living Atlas (HeroBackground.jsx: a dot-matrix map with routes arcing from
// a sending city to an unreached region, each ending in a status pulse),
// distilled to logo scale. Deliberately not a letterform — a monogram says
// "this is the brand initial," this says "this is what the brand does."
// pathLength="100" normalizes the arc to 100 units regardless of its actual
// geometry, so the CSS draw-in animation can use round dasharray/dashoffset
// numbers instead of a measured getTotalLength().
const ROUTE_PATH = 'M4,23 Q13,4 25,8';

const wordmarkMotion = {
  initial: { opacity: 0, x: -4 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.05 } },
  exit: { opacity: 0, x: -4, transition: { duration: 0.12 } }
};

// Nav lockup — a constant icon mark plus the "Fielded" wordmark, which
// collapses away on scroll (TopNav's scroll-collapsed state) leaving just
// the mark. m.* (not motion.*) since this renders under RootLayout's
// LazyMotion boundary — see RootLayout.jsx.
export default function BrandLockup({ expanded }) {
  return (
    <span className="brand-lockup" aria-hidden="true">
      <svg className="brand-mark" viewBox="0 0 29 29" width="26" height="26" fill="none">
        <path d={ROUTE_PATH} pathLength="100" className="brand-mark-route" />
        <circle cx="4" cy="23" r="2.1" className="brand-mark-origin" />
        <circle cx="25" cy="8" r="2.6" className="brand-mark-dest-pulse" />
        <circle cx="25" cy="8" r="2.6" className="brand-mark-dest" />
      </svg>
      <AnimatePresence initial={false}>
        {expanded && (
          <m.span
            key="wordmark"
            className="brand-lockup-word"
            variants={wordmarkMotion}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            Fielded
          </m.span>
        )}
      </AnimatePresence>
    </span>
  );
}
