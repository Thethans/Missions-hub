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

// public/images/route-fly-plane.png is drawn nose-up — BASE_ROTATE turns
// that to nose-right (rotate(90deg) takes 12 o'clock to 3 o'clock), so it
// actually reads as flying in its direction of travel instead of just
// sliding sideways nose-first-into-nothing. The bank wobble below is a
// small offset AROUND this base, not a replacement for it.
const BASE_ROTATE = 90;

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

function flightBank(startOffset, endOffset) {
  const start = BASE_ROTATE + startOffset;
  const end = BASE_ROTATE + endOffset;
  const mid1 = start + (end - start) * 0.3 - 3;
  const mid2 = start + (end - start) * 0.7 + 2;
  return [start, mid1, mid2, end];
}

const PLANE_RESET_ROTATE = BASE_ROTATE - 4;

// The panel is wider than the viewport (130vw, not 100vw) with a gradient
// baked into its left ~23% — solid navy everywhere else. Sized/positioned
// so that x:-30vw lands the solid portion exactly over the viewport (full
// opaque coverage, no dissolve visible), while sweeping on to x:100vw
// carries that soft-left-edge gradient segment across the viewport right
// at the tail of the reveal — the "dissolves into the new page" moment —
// rather than a hard-edged cut. See the .route-fly-panel comment in
// styles.css for the exact math.
const PANEL_HIDDEN_LEFT = '-130vw';
const PANEL_COVERED = '-30vw';
const PANEL_HIDDEN_RIGHT = '100vw';

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
        panelControls.start({ x: PANEL_COVERED, transition: { duration: COVER_DURATION, ease: COVER_EASE } }),
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
        panelControls.start({ x: PANEL_HIDDEN_RIGHT, transition: { duration: REVEAL_DURATION, ease: REVEAL_EASE } }),
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
      panelControls.set({ x: PANEL_HIDDEN_LEFT });
      planeControls.set({ x: '-70vw', y: '-50%', rotate: PLANE_RESET_ROTATE, opacity: 0 });
      setIsFlying(false);
    })();
  }, [location, displayLocation, panelControls, planeControls, prefersReduced]);

  return { displayLocation, panelControls, planeControls, isFlying, prefersReduced };
}
