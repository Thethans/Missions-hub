import React, { useEffect, useRef } from 'react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import useMatchMedia from '../hooks/useMatchMedia.js';

const FINE_POINTER_QUERY = '(pointer: fine)';

// Soft cursor-following glow for flat-navy sections that don't already have
// the hero/stats-strip's atlas-dot richness — same "living, responsive
// surface" idea as HeroBackground's cursor parallax, extended to plain
// sections. Position is written directly as CSS custom properties (no
// React re-render per mousemove, same imperative-DOM pattern the hero
// parallax uses) so it stays cheap even on a fast mousemove stream.
// Fine-pointer desktops only, off entirely under reduced motion. The
// parent section must have position:relative (or position:relative;
// z-index:0 if it also needs a grain overlay below its content).
export default function SpotlightOverlay() {
  const ref = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const finePointer = useMatchMedia(FINE_POINTER_QUERY);

  useEffect(() => {
    if (prefersReduced || !finePointer) return;
    const el = ref.current;
    const parent = el?.parentElement;
    if (!parent) return;

    const handleMove = (e) => {
      const rect = parent.getBoundingClientRect();
      el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
      el.style.opacity = '1';
    };
    const handleLeave = () => {
      el.style.opacity = '0';
    };

    parent.addEventListener('mousemove', handleMove);
    parent.addEventListener('mouseleave', handleLeave);
    return () => {
      parent.removeEventListener('mousemove', handleMove);
      parent.removeEventListener('mouseleave', handleLeave);
    };
  }, [prefersReduced, finePointer]);

  if (prefersReduced || !finePointer) return null;

  return <div ref={ref} className="spotlight-overlay" aria-hidden="true" />;
}
