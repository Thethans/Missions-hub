import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';
import usePrefersReducedMotion from './usePrefersReducedMotion.js';
import useMatchMedia from './useMatchMedia.js';

const FINE_POINTER_QUERY = '(pointer: fine)';

// 3D tilt toward wherever the cursor sits within the element — rotateX/
// rotateY driven by how far off-center the pointer is, spring-smoothed,
// resets to flat on mouseleave. Same gating convention as useMagnetic.
// Returns { ref, style }: attach ref to the element that should react, and
// spread style onto a motion.* wrapper around it.
export default function useTilt(maxDegrees = 8) {
  const ref = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const finePointer = useMatchMedia(FINE_POINTER_QUERY);
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 200, damping: 20, mass: 0.5 });
  const rotateY = useSpring(rawRotateY, { stiffness: 200, damping: 20, mass: 0.5 });

  useEffect(() => {
    if (prefersReduced || !finePointer) return;
    const el = ref.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rawRotateY.set(px * maxDegrees * 2);
      rawRotateX.set(py * -maxDegrees * 2);
    };
    const handleLeave = () => {
      rawRotateX.set(0);
      rawRotateY.set(0);
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
    };
  }, [prefersReduced, finePointer, rawRotateX, rawRotateY, maxDegrees]);

  const style = prefersReduced || !finePointer ? undefined : { rotateX, rotateY, transformPerspective: 800 };
  return { ref, style };
}
