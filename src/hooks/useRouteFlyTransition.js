import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnimation } from 'framer-motion';
import usePrefersReducedMotion from './usePrefersReducedMotion.js';

// Drives the "plane flies across and covers the screen" route transition
// (see RouteFlyOverlay.jsx). The actual page swap doesn't happen the
// instant the URL changes — <Routes> is rendered against `displayLocation`
// here rather than the live router location. Previously this was two
// separate awaited animations (cover, then a hold, then reveal), which
// read as a stutter — the plane visibly stopped dead for a beat mid-
// flight. It's now ONE continuous keyframed pass for both panel and
// plane, sharing the same `times` breakpoints, with the page swap fired
// via a plain setTimeout at the same elapsed moment the panel's keyframes
// say it's at full coverage (SWAP_FRACTION) — i.e. right as the plane's
// wings are passing — instead of gating on an awaited sub-animation
// finishing. The new page is live well before the plane finishes its
// pass, not after the whole thing has played out.
const FLIGHT_DURATION = 3.4;
// Fraction of FLIGHT_DURATION at which the plane is centered and the
// panel is at full opaque coverage — the moment it's safe (invisible) to
// swap the actual page content, and the moment that reads as "the wings
// have passed."
const SWAP_FRACTION = 0.4;
const FLIGHT_TIMES = [0, SWAP_FRACTION, 1];
// Ease in on the approach, ease out on the departure — one continuous
// curve, not two separate animations glued together with a pause.
const FLIGHT_EASE = [[0.45, 0, 0.4, 1], [0.4, 0, 0.35, 1]];

// public/images/route-fly-plane.png is drawn nose-up — BASE_ROTATE turns
// that to nose-right (rotate(90deg) takes 12 o'clock to 3 o'clock), so it
// actually reads as flying in its direction of travel instead of just
// sliding sideways nose-first-into-nothing. Held constant for the whole
// flight — no bob/bank wobble — a steady, continuous glide instead of
// something that reads as shaking.
const BASE_ROTATE = 90;

// The panel is wider than the viewport (130vw, not 100vw) with a gradient
// baked into its left ~23% — solid navy everywhere else. Sized/positioned
// so that x:-30vw lands the solid portion exactly over the viewport (full
// opaque coverage, no dissolve visible), while sweeping on to x:100vw
// carries that soft-left-edge gradient segment across the viewport for
// the rest of the pass — the "dissolves into the new page" moment —
// rather than a hard-edged cut. See the .route-fly-panel comment in
// styles.css for the exact math.
const PANEL_HIDDEN_LEFT = '-130vw';
const PANEL_COVERED = '-30vw';
const PANEL_HIDDEN_RIGHT = '100vw';

const PANEL_X_KEYFRAMES = [PANEL_HIDDEN_LEFT, PANEL_COVERED, PANEL_HIDDEN_RIGHT];
const PLANE_X_KEYFRAMES = ['-70vw', '0vw', '95vw'];
const PLANE_OPACITY_KEYFRAMES = [0, 1, 0];

export default function useRouteFlyTransition() {
  const location = useLocation();
  const prefersReduced = usePrefersReducedMotion();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isFlying, setIsFlying] = useState(false);
  const panelControls = useAnimation();
  const planeControls = useAnimation();
  // Guards against a second nav starting mid-flight from finishing an
  // in-flight promise chain (or firing the delayed swap) after it no
  // longer matches the latest location.
  const runId = useRef(0);

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return;

    if (prefersReduced) {
      setDisplayLocation(location);
      return;
    }

    const id = ++runId.current;
    setIsFlying(true);

    const swapTimer = setTimeout(() => {
      if (runId.current !== id) return;
      setDisplayLocation(location);
    }, SWAP_FRACTION * FLIGHT_DURATION * 1000);

    Promise.all([
      panelControls.start({ x: PANEL_X_KEYFRAMES, transition: { duration: FLIGHT_DURATION, times: FLIGHT_TIMES, ease: FLIGHT_EASE } }),
      planeControls.start({
        x: PLANE_X_KEYFRAMES,
        y: '-50%',
        rotate: BASE_ROTATE,
        opacity: PLANE_OPACITY_KEYFRAMES,
        // y/rotate don't change (constant, no bob/bank wobble) — a plain
        // ease avoids handing a 2-entry per-segment `ease` array to a
        // property that only has one segment (start === end).
        transition: {
          duration: FLIGHT_DURATION,
          times: FLIGHT_TIMES,
          ease: FLIGHT_EASE,
          y: { ease: 'linear' },
          rotate: { ease: 'linear' }
        }
      })
    ]).then(() => {
      if (runId.current !== id) return;
      // Reset off-screen-left, ready for the next navigation.
      panelControls.set({ x: PANEL_HIDDEN_LEFT });
      planeControls.set({ x: '-70vw', y: '-50%', rotate: BASE_ROTATE, opacity: 0 });
      setIsFlying(false);
    });

    return () => clearTimeout(swapTimer);
  }, [location, displayLocation, panelControls, planeControls, prefersReduced]);

  return { displayLocation, panelControls, planeControls, isFlying, prefersReduced };
}
