import React, { useEffect, useRef } from 'react';
import { m, useMotionValue, useMotionTemplate, useInView, animate } from 'framer-motion';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

// Two variants, not one recipe reused everywhere: 'display' is the same
// bloom HomePage's HeroHeadline already uses on the Fielded wordmark
// (Fraunces Variable's wght/opsz axes swelling from a thin, condensed form
// into full display weight) — used by ChapterTitle, matching the rest of
// the site's headings. 'numeral' is a deliberately different typeface
// (Recursive Variable, --font-story-number) for the story's standalone big
// numbers (ColdOpen's "4.3B", the Abyss landing stats) — mechanical/
// monospaced (MONO axis at 1) resolving into its normal proportional form
// (MONO at 0) as it settles, which reads as a genuinely distinct animation
// rather than the display bloom repeated a third time.
const VARIANTS = {
  display: {
    fontFamily: null,
    from: { wght: 260, opsz: 14 },
    to: { wght: 700, opsz: 100 },
    template: (wght, opsz) => `'wght' ${wght}, 'opsz' ${opsz}`
  },
  numeral: {
    fontFamily: 'var(--font-story-number)',
    from: { wght: 320, mono: 1 },
    to: { wght: 700, mono: 0 },
    template: (wght, mono) => `'wght' ${wght}, 'MONO' ${mono}`
  }
};

export default function VariableBloom({ children, className, duration = 1.6, variant = 'display' }) {
  const prefersReduced = usePrefersReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const config = VARIANTS[variant] || VARIANTS.display;

  const isNumeral = variant === 'numeral';
  const bKey = isNumeral ? 'mono' : 'opsz';
  const a = useMotionValue(prefersReduced ? config.to.wght : config.from.wght);
  const b = useMotionValue(prefersReduced ? config.to[bKey] : config.from[bKey]);
  // Both templates are computed unconditionally (hook call order can't
  // depend on `variant`, but `variant` is a prop that never changes after
  // mount in practice) — only the one matching bKey is actually used below.
  const displayTemplate = useMotionTemplate`'wght' ${a}, 'opsz' ${b}`;
  const numeralTemplate = useMotionTemplate`'wght' ${a}, 'MONO' ${b}`;
  const fontVariationSettings = isNumeral ? numeralTemplate : displayTemplate;

  useEffect(() => {
    if (prefersReduced || !inView) return;
    const ca = animate(a, config.to.wght, { duration, ease: EASE });
    const cb = animate(b, config.to[bKey], { duration, ease: EASE });
    return () => {
      ca.stop();
      cb.stop();
    };
    // a/b are framer-motion useMotionValue containers — stable identity
    // across renders, safe to list here.
  }, [inView, prefersReduced, duration, a, b, config, bKey]);

  return (
    <m.span
      ref={ref}
      className={className}
      style={{
        fontVariationSettings,
        fontFamily: config.fontFamily || undefined
      }}
    >
      {children}
    </m.span>
  );
}
