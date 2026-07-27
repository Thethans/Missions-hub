import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnimation } from 'framer-motion';
import usePrefersReducedMotion from './usePrefersReducedMotion.js';

// Drives the "plane flies across" route transition (see
// RouteFlyOverlay.jsx). The actual page swap doesn't happen the instant
// the URL changes — <Routes> is rendered against `displayLocation` here
// rather than the live router location. There's no covering panel to hide
// that swap behind anymore (by request — "nothing else besides a plane"),
// so the swap is a plain, visible cut timed to fire the moment the wings
// are crossing screen-center, not before or after.
//
// One continuous, constant-velocity pass (a single 3-keyframe `x`
// animation with a plain 'linear' ease and evenly-spaced `times`) — no
// separate cover/hold/reveal animations, and no bob/bank wobble. Either
// of those previously read as the plane slowing, stopping, or shaking;
// this is just a straight, unbroken glide left to right.
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
// is exactly how far the plane's geometric center needs to sit from
// true-center to clear the screen completely on either side, regardless
// of viewport aspect ratio (mixing vw/vh in one calc() lets the browser
// do that per-device instead of a single fixed number that's only
// correct for one specific aspect ratio).
const HALF_FUSELAGE_VH = (1200 * IMAGE_SCALE_VH_PER_PX) / 2; // 1200 is the source image's HEIGHT (1280 is its width, already used above)
// Exported so RouteFlyOverlay.jsx's `initial` (the very first render,
// before any flight has run) matches this exactly instead of duplicating
// the calc() string.
export const PLANE_HIDDEN_LEFT = `calc(-50vw - ${HALF_FUSELAGE_VH}vh)`;
const PLANE_HIDDEN_RIGHT = `calc(50vw + ${HALF_FUSELAGE_VH}vh)`;
const PLANE_X_KEYFRAMES = [PLANE_HIDDEN_LEFT, 0, PLANE_HIDDEN_RIGHT];
const PLANE_OPACITY_KEYFRAMES = [0, 1, 0];

// The fraction of FLIGHT_DURATION at which the WING (not the plane's
// overall geometric center) crosses true screen-center — since motion is
// linear/constant-velocity the whole way, this is just linear
// interpolation between the hidden-left and hidden-right endpoints,
// evaluated in one common unit (vh-equivalent) at a representative ~16:9
// viewport (this is a decorative sync, not pixel-critical, so one fixed
// approximation across aspect ratios is fine — 50vw at aspect A is
// 50*A vh-equivalent units).
const REPRESENTATIVE_ASPECT = 1.6; // vw:vh at a typical desktop viewport
const HALF_VIEWPORT_WIDTH_VH_EQUIV = 50 * REPRESENTATIVE_ASPECT;
const HIDDEN_LEFT_VH_EQUIV = -(HALF_VIEWPORT_WIDTH_VH_EQUIV + HALF_FUSELAGE_VH);
const HIDDEN_RIGHT_VH_EQUIV = HALF_VIEWPORT_WIDTH_VH_EQUIV + HALF_FUSELAGE_VH;
// The plane's center must be WING_OFFSET_FROM_CENTER_VH to the right of
// true-center for its trailing wing to have just reached true-center.
const SWAP_FRACTION = (WING_OFFSET_FROM_CENTER_VH - HIDDEN_LEFT_VH_EQUIV) / (HIDDEN_RIGHT_VH_EQUIV - HIDDEN_LEFT_VH_EQUIV);

export default function useRouteFlyTransition() {
  const location = useLocation();
  const prefersReduced = usePrefersReducedMotion();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [isFlying, setIsFlying] = useState(false);
  const planeControls = useAnimation();
  // Guards against a second nav starting mid-flight from firing the
  // delayed swap or reset after it no longer matches the latest location.
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

    planeControls
      .start({
        x: PLANE_X_KEYFRAMES,
        rotate: BASE_ROTATE,
        opacity: PLANE_OPACITY_KEYFRAMES,
        transition: { duration: FLIGHT_DURATION, times: FLIGHT_TIMES, ease: 'linear' }
      })
      .then(() => {
        if (runId.current !== id) return;
        // Reset off-screen-left, ready for the next navigation.
        planeControls.set({ x: PLANE_HIDDEN_LEFT, rotate: BASE_ROTATE, opacity: 0 });
        setIsFlying(false);
      });

    return () => clearTimeout(swapTimer);
  }, [location, displayLocation, planeControls, prefersReduced]);

  return { displayLocation, planeControls, isFlying, prefersReduced };
}
