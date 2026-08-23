import React, { useEffect, useRef } from 'react';
import { m, useMotionValue, useMotionTemplate, useInView, animate } from 'framer-motion';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

// The same "bloom" HomePage's HeroHeadline uses on the Fielded wordmark
// (Fraunces Variable's wght/opsz axes swelling from a thin, condensed form
// into full display weight) — generalized so any story number or title can
// get it, triggered by scroll-into-view instead of only on mount, since
// these sit scattered down the page rather than all at the top. Starts with
// ColdOpen's "4.3B" (spec ask), reused for the chapter titles and the Abyss
// landing stats.
export default function VariableBloom({ children, className, duration = 1.6 }) {
  const prefersReduced = usePrefersReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const wght = useMotionValue(prefersReduced ? 700 : 260);
  const opsz = useMotionValue(prefersReduced ? 100 : 14);
  const fontVariationSettings = useMotionTemplate`'wght' ${wght}, 'opsz' ${opsz}`;

  useEffect(() => {
    if (prefersReduced || !inView) return;
    const w = animate(wght, 700, { duration, ease: EASE });
    const o = animate(opsz, 100, { duration, ease: EASE });
    return () => {
      w.stop();
      o.stop();
    };
    // wght/opsz are framer-motion useMotionValue containers — stable
    // identity across renders, safe to list here.
  }, [inView, prefersReduced, duration, wght, opsz]);

  return (
    <m.span ref={ref} className={className} style={{ fontVariationSettings }}>
      {children}
    </m.span>
  );
}
