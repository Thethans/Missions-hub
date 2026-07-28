import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Fielded's mark is one letterform (the wordmark's own "F", Fraunces 600)
// plus one fixed accent, the ember dot — used two ways from the Atlas
// brand toolkit ("Fielded Logo Variations"):
//   - Monogram: a plain circle sits on the F like a diacritic.
//   - Wordmark: the "i"'s own tittle is recolored in place, not covered by
//     a separately-positioned circle. A manually-positioned circle has to
//     be measured against the glyph (font metrics, kerning between
//     elements, hinting) and drifts out of alignment whenever any of that
//     changes underneath it. Instead we stack an exact duplicate of the
//     same "i" — same font, same size, same position — on top, clipped to
//     just its top portion. Because it's literally the same glyph, it
//     lines up with the original pixel-for-pixel no matter how the font
//     renders, with nothing to measure or drift.
const monogramDotTransition = { type: 'spring', stiffness: 420, damping: 34 };

const suffixMotion = {
  initial: { opacity: 0, x: -4 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.2, delay: 0.05 } },
  exit: { opacity: 0, x: -4, transition: { duration: 0.12 } }
};

// Animated nav lockup — collapses to the bare "F" monogram or expands to
// the full "Fielded" wordmark (TopNav's scroll-collapsed state).
export default function BrandLockup({ expanded }) {
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
            <span className="brand-lockup-i-wrap">
              <span className="brand-lockup-i">i</span>
              <span className="brand-lockup-i brand-lockup-i-dot">i</span>
            </span>
            elded
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {!expanded && (
          <motion.span
            key="monogram-dot"
            className="brand-dot brand-dot--monogram"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={monogramDotTransition}
          />
        )}
      </AnimatePresence>
    </span>
  );
}
