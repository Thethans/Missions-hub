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
//
// A slow, deliberate pace (a few seconds each way) plus a gentle vertical
// bob and drifting bank angle on the plane — not just a straight
// horizontal slide — is what sells "gliding through the air" rather than
// "a UI panel sliding." The panel shares the plane's duration so the two
// stay in lockstep: the wipe reaches full coverage exactly when the plane
// reaches center, instead of the panel finishing early and leaving the
// plane to coast across a screen that's already blank navy.
const COVER_EASE = [0.45, 0, 0.4, 1];
const REVEAL_EASE = [0.4, 0, 0.35, 1];
const COVER_DURATION = 2.4;
const HOLD_MS = 250;
const REVEAL_DURATION = 2.8;

// Gentle up/down lift and a slowly drifting bank angle, sampled at even
// intervals across whichever phase duration is passed in — this is what
// turns a flat left-to-right slide into something that reads as airborne.
// Percent strings, not bare numbers — framer-motion treats a unitless
// number as pixels, which would silently blow up the vertical centering
// this relies on (top: 50% + y: -50% == true-centered; y: -50 == -50px).
function flightBob(baseYPercent) {
  return [baseYPercent, baseYPercent - 2.5, baseYPercent + 1.5, baseYPercent - 1.5, baseYPercent]
    .map((v) => `${v}%`);
}

function flightBank(startDeg, endDeg) {
  const mid1 = startDeg + (endDeg - startDeg) * 0.3 - 3;
  const mid2 = startDeg + (endDeg - startDeg) * 0.7 + 2;
  return [startDeg, mid1, mid2, endDeg];
}

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
        planeControls.start({
          x: '0vw',
          y: flightBob(-50),
          rotate: flightBank(-4, 6),
          opacity: 1,
          transition: { duration: COVER_DURATION, ease: COVER_EASE, y: { ease: 'easeInOut' }, rotate: { ease: 'easeInOut' } }
        })
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
        planeControls.start({
          x: '95vw',
          y: flightBob(-50),
          rotate: flightBank(6, 2),
          opacity: 0,
          transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE, y: { ease: 'easeInOut' }, rotate: { ease: 'easeInOut' } }
        })
      ]);
      if (runId.current !== id) return;

      // Reset off-screen-left, ready for the next navigation.
      panelControls.set({ x: '-100%' });
      planeControls.set({ x: '-70vw', y: '-50%', rotate: -4, opacity: 0 });
      setIsFlying(false);
    })();
  }, [location, displayLocation, panelControls, planeControls, prefersReduced]);

  return { displayLocation, panelControls, planeControls, isFlying, prefersReduced };
}
