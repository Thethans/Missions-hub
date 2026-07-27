import React from 'react';
import { motion } from 'framer-motion';
import { PLANE_HIDDEN_LEFT } from '../hooks/useRouteFlyTransition.js';

// The visual half of the route transition (see useRouteFlyTransition.js for
// the sequencing/timing). There's no separate covering panel anymore —
// the plane graphic is the only thing on screen during the transition,
// and the page swaps directly underneath it. Both layers below are inert
// (aria-hidden, no focusable content) — this is pure transition chrome,
// never a thing a screen reader or keyboard user needs to stop on.
//
// public/images/route-fly-plane.png: a solid top-down airplane silhouette
// (filled, not an outline/blueprint), transparent background, from Pixabay
// (cdn.pixabay.com/photo/2026/01/12/15/44/airplane-10064722_1280.png,
// uploaded by DARKTOR) — free for commercial use under the Pixabay
// Content License, no attribution required. Recolored from solid-black to
// solid-paper-white via the CSS invert filter in styles.css. The source
// art is drawn nose-up; BASE_ROTATE (90deg, matched here in `initial` and
// held constant for the whole flight in useRouteFlyTransition.js) turns
// that so the nose points into the direction of travel (right).
const BASE_ROTATE = 90;

export default function RouteFlyOverlay({ planeControls, isFlying }) {
  return (
    <>
      <div className="route-fly-input-guard" aria-hidden="true" style={{ pointerEvents: isFlying ? 'auto' : 'none' }} />
      {/* Static outer anchor centers exactly on the viewport regardless of
          the plane's own (large) box size; the inner motion.div's x is
          then a plain "distance from true center" — see the
          .route-fly-plane-anchor comment in styles.css for why this is
          two elements instead of one. */}
      <div className="route-fly-plane-anchor">
        <motion.div
          className="route-fly-plane-wrap"
          initial={{ x: PLANE_HIDDEN_LEFT, rotate: BASE_ROTATE, opacity: 0 }}
          animate={planeControls}
          aria-hidden="true"
        >
          <img src="/images/route-fly-plane.png" alt="" className="route-fly-plane" />
        </motion.div>
      </div>
    </>
  );
}
