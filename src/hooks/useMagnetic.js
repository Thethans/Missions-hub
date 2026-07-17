import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import usePrefersReducedMotion from './usePrefersReducedMotion.js';
import useMatchMedia from './useMatchMedia.js';

const FINE_POINTER_QUERY = '(pointer: fine)';

// The wrapped element gently pulls toward the cursor while the pointer is
// over it, spring-smoothed so it trails rather than snaps, and relaxes back
// to center on mouseleave. Fine-pointer desktops only, off entirely under
// reduced motion — same gating convention as HeroBackground's cursor
// parallax. Returns { ref, style }: attach ref to the element that should
// react, and spread style onto a motion.* wrapper around it.
export default function useMagnetic(strength = 0.35) {
  const ref = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const finePointer = useMatchMedia(FINE_POINTER_QUERY);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 150, damping: 15, mass: 0.3 });
  const y = useSpring(rawY, { stiffness: 150, damping: 15, mass: 0.3 });

  useEffect(() => {
    if (prefersReduced || !finePointer) return;
    const el = ref.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      rawX.set((e.clientX - cx) * strength);
      rawY.set((e.clientY - cy) * strength);
    };
    const handleLeave = () => {
      rawX.set(0);
      rawY.set(0);
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [prefersReduced, finePointer, rawX, rawY, strength]);

  const style = prefersReduced || !finePointer ? undefined : { x, y };
  return { ref, style };
}
