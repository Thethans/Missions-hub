import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnimation } from 'framer-motion';
import usePrefersReducedMotion from './usePrefersReducedMotion.js';

// Drives the "plane pulls a curtain across, revealing the new page" route
// transition (see RouteFlyOverlay.jsx). The metaphor is literal: a solid,
// fully opaque curtain's LEADING edge is pinned to the plane's wing at
// every instant (not animated separately — its keyframes are the plane's
// own keyframes, offset by a constant, so the two stay in lockstep by
// construction, not by matching timing numbers between two independent
// animations). Right of the wing is still curtain (old page hidden
// underneath); left of the wing is bare page, because the curtain has
// already swept past there.
//
// Because the curtain covers the ENTIRE viewport at t=0 (it's wide enough
// that even at the flight's leftmost point its far edge reaches well past
// the right side of any reasonable viewport), <Routes> can swap to the
// new page the instant the flight starts — no separate timed
// setTimeout, no gap where anything's visible except curtain+plane.
//
// One continuous, constant-velocity pass — a single 3-keyframe `x`
// animation with ease:'linear' — no bob/bank wobble, no opacity fade.
// The plane is opacity:1 for the entire flight; it's only ever hidden by
// sitting off-screen, never by fading.
const FLIGHT_DURATION = 3.4;
const FLIGHT_TIMES = [0, 0.5, 1];

// public/images/route-fly-plane.png is drawn nose-up — BASE_ROTATE turns
// that to nose-right (rotate(90deg) takes 12 o'clock to 3 o'clock) so it
// reads as flying in its direction of travel. Held constant for the whole
// flight (no bank wobble).
const BASE_ROTATE = 90;

// The source image is 1280x1200 (width x height, pre-rotation) — width
// becomes the on-screen vertical extent post-rotation (see .route-fly-
// plane's width:100vh in styles.css), so the scale factor from the
// original image's own pixel space to on-screen vh is 100/1280.
const IMAGE_SCALE_VH_PER_PX = 100 / 1280;
// Measured directly from the source PNG (widest opaque row, i.e. the
// wingspan): y=747 of 1200px height, vs. the image's vertical midpoint at
// y=600 — the wings sit 147px toward the TAIL from center. After the
// nose-right rotation, "toward the tail" is "toward screen-left", so the
// wings trail the plane's own geometric x-center by this many vh.
const WING_OFFSET_FROM_CENTER_VH = (747 - 1200 / 2) * IMAGE_SCALE_VH_PER_PX; // ≈ 11.5, trailing (left of) center

// Fuselage length on screen post-rotation (the image's original HEIGHT,
// scaled by the same factor) — half of this plus half the viewport width
// is how far the plane's geometric center needs to sit from true-center
// to clear the screen completely on either side, regardless of viewport
// aspect ratio (mixing vw/vh in one calc() lets the browser do that
// per-device instead of a single fixed number correct for only one
// aspect ratio).
const HALF_FUSELAGE_VH = (1200 * IMAGE_SCALE_VH_PER_PX) / 2; // 1200 is the source image's HEIGHT (1280 is its width, already used above)
// Exported so RouteFlyOverlay.jsx's `initial` (the very first render,
// before any flight has run) matches this exactly instead of duplicating
// the calc() string.
export const PLANE_HIDDEN_LEFT = `calc(-50vw - ${HALF_FUSELAGE_VH}vh)`;
const PLANE_HIDDEN_RIGHT = `calc(50vw + ${HALF_FUSELAGE_VH}vh)`;
const PLANE_X_KEYFRAMES = [PLANE_HIDDEN_LEFT, 0, PLANE_HIDDEN_RIGHT];

// The curtain's leading (left) edge is the plane's own x, shifted by the
// wing's offset from the plane's geometric center — literally the same
// keyframes as PLANE_X_KEYFRAMES with WING_OFFSET_FROM_CENTER_VH added to
// each, so it's pinned to the wing at every instant instead of just at
// one moment. (calc(0 + Nvh) collapses fine — no special-casing needed
// for the "0" center keyframe.)
export const CURTAIN_HIDDEN_LEFT = `calc(-50vw - ${HALF_FUSELAGE_VH - WING_OFFSET_FROM_CENTER_VH}vh)`;
const CURTAIN_X_KEYFRAMES = [
  CURTAIN_HIDDEN_LEFT,
  `calc(${WING_OFFSET_FROM_CENTER_VH}vh)`,
  `calc(50vw + ${HALF_FUSELAGE_VH + WING_OFFSET_FROM_CENTER_VH}vh)`
];

export default function useRouteFlyTransition() {
  const location = useLocation();
  const prefersReduced = usePrefersReducedMotion();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isFlying, setIsFlying] = useState(false);
  const planeControls = useAnimation();
  const curtainControls = useAnimation();
  // Guards against a second nav starting mid-flight from firing the reset
  // after it no longer matches the latest location.
  const runId = useRef(0);

  useEffect(() => {
    if (location.pathname === displayLocation.pathname) return;

    if (prefersReduced) {
      setDisplayLocation(location);
      return;
    }

    const id = ++runId.current;
    setIsFlying(true);
    // The curtain covers the whole viewport at t=0 (see the module
    // comment) — safe to swap immediately, revealed progressively as the
    // curtain (pinned to the wing) sweeps past each point on screen.
    setDisplayLocation(location);

    Promise.all([
      planeControls.start({
        x: PLANE_X_KEYFRAMES,
        rotate: BASE_ROTATE,
        opacity: 1,
        transition: { duration: FLIGHT_DURATION, times: FLIGHT_TIMES, ease: 'linear' }
      }),
      curtainControls.start({
        x: CURTAIN_X_KEYFRAMES,
        transition: { duration: FLIGHT_DURATION, times: FLIGHT_TIMES, ease: 'linear' }
      })
    ]).then(() => {
      if (runId.current !== id) return;
      // Reset off-screen-left, ready for the next navigation.
      planeControls.set({ x: PLANE_HIDDEN_LEFT, rotate: BASE_ROTATE, opacity: 1 });
      curtainControls.set({ x: CURTAIN_HIDDEN_LEFT });
      setIsFlying(false);
    });
  }, [location, displayLocation, planeControls, curtainControls, prefersReduced]);

  return { displayLocation, planeControls, curtainControls, isFlying, prefersReduced };
}
