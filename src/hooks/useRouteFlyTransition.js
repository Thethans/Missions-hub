import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnimation } from 'framer-motion';
import usePrefersReducedMotion from './usePrefersReducedMotion.js';

// Drives the "plane flies across and covers the screen" route transition
// (see RouteFlyOverlay.jsx). The actual page swap doesn't happen the
// instant the URL changes — <Routes> is rendered against `displayLocation`
// here rather than the live router location, so the old page keeps
// rendering until the plane/panel have fully covered the viewport, only
// then do we flip displayLocation to the real one (still hidden behind the
// cover), then animate off to reveal it. Without this indirection the new
// page would pop in instantly and the "cover" would just be decoration
// layered on top of an already-swapped page.
const COVER_EASE = [0.76, 0, 0.24, 1];
const REVEAL_EASE = [0.16, 1, 0.3, 1];
const COVER_DURATION = 0.38;
const HOLD_MS = 90;
const REVEAL_DURATION = 0.46;

export default function useRouteFlyTransition() {
  const location = useLocation();
  const prefersReduced = usePrefersReducedMotion();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isFlying, setIsFlying] = useState(false);
  const panelControls = useAnimation();
  const planeControls = useAnimation();
  // Guards against a second nav starting mid-flight from finishing an
  // in-flight promise chain that no longer matches the latest location.
  const runId = useRef(0);

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return;

    if (prefersReduced) {
      setDisplayLocation(location);
      return;
    }

    const id = ++runId.current;
    setIsFlying(true);

    (async () => {
      await Promise.all([
        panelControls.start({ x: '0%', transition: { duration: COVER_DURATION, ease: COVER_EASE } }),
        planeControls.start({ x: '0vw', opacity: 1, transition: { duration: Math.max(0.1, COVER_DURATION - 0.05), ease: COVER_EASE } })
      ]);
      if (runId.current !== id) return;

      // Screen is fully covered — swap the actual routed content now,
      // invisibly, then hold for a beat so the new page has a frame to
      // paint before the cover starts pulling away.
      setDisplayLocation(location);
      await new Promise((resolve) => setTimeout(resolve, HOLD_MS));
      if (runId.current !== id) return;

      await Promise.all([
        panelControls.start({ x: '100%', transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE } }),
        planeControls.start({ x: '95vw', opacity: 0, transition: { duration: REVEAL_DURATION + 0.05, ease: REVEAL_EASE } })
      ]);
      if (runId.current !== id) return;

      // Reset off-screen-left, ready for the next navigation.
      panelControls.set({ x: '-100%' });
      planeControls.set({ x: '-70vw', opacity: 0 });
      setIsFlying(false);
    })();
  }, [location, displayLocation, panelControls, planeControls, prefersReduced]);

  return { displayLocation, panelControls, planeControls, isFlying, prefersReduced };
}
