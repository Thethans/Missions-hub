import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

// One shared motion.path/pathLength mechanism, three usages of the same
// technique:
// - variant="scroll": draws in as the section scrolls into view (Home how-it-works connector)
// - variant="hover": draws in on hover, driven by the `hovered` prop (nav underline)
// - variant="load": draws in once on mount (hero background route line)
export default function RouteLine({ variant, containerRef, hovered, pathD, viewBox, className, delay = 0 }) {
  const prefersReduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll(
    variant === 'scroll' ? { target: containerRef, offset: ['start 0.85', 'end 0.5'] } : {}
  );
  const scrollPathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  if (variant === 'scroll') {
    return (
      <svg viewBox={viewBox} className={className} preserveAspectRatio="none" aria-hidden="true">
        <motion.path
          d={pathD}
          fill="none"
          stroke="var(--voyage-teal)"
          strokeWidth="2"
          strokeDasharray="6 6"
          style={prefersReduced ? undefined : { pathLength: scrollPathLength }}
          initial={false}
          animate={{ opacity: 1 }}
        />
      </svg>
    );
  }

  if (variant === 'load') {
    return (
      <svg viewBox={viewBox} className={className} preserveAspectRatio="none" aria-hidden="true">
        <motion.path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="5 7"
          strokeLinecap="round"
          initial={prefersReduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: prefersReduced ? 0 : 1.4, delay: prefersReduced ? 0 : delay, ease: 'easeOut' }}
        />
      </svg>
    );
  }

  return (
    <svg viewBox={viewBox} className={className} preserveAspectRatio="none" aria-hidden="true">
      <motion.path
        d={pathD}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        initial={false}
        animate={{ pathLength: hovered ? 1 : 0 }}
        transition={{ duration: prefersReduced ? 0 : 0.25 }}
      />
    </svg>
  );
}
