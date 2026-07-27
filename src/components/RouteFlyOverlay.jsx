import React from 'react';
import { motion } from 'framer-motion';

// The visual half of the route transition (see useRouteFlyTransition.js for
// the sequencing/timing). Two independently-animated layers riding the same
// left-to-right pass: a full-viewport navy panel that actually guarantees
// total coverage (the plane graphic alone, with all its negative space,
// never could), and a huge plane graphic layered on top for the "flies
// across" read. Both are inert (aria-hidden, no focusable content) — this
// is pure transition chrome, never a thing a screen reader or keyboard
// user needs to stop on.
//
// public/images/route-fly-plane.png: a solid top-down airplane silhouette
// (filled, not an outline/blueprint), transparent background, from Pixabay
// (cdn.pixabay.com/photo/2013/07/13/01/21/jet-155574_1280.png, uploaded by
// OpenClipart-Vectors) — free for commercial use under the Pixabay Content
// License, no attribution required. Recolored from solid-black to
// solid-paper-white via the CSS invert filter in styles.css so it reads
// against the navy panel. The source art is drawn nose-up; BASE_ROTATE in
// useRouteFlyTransition.js turns that 90deg so the nose points into the
// direction of travel (right) instead of sideways.
const PLANE_INITIAL_ROTATE = 86; // BASE_ROTATE (90) - 4, matches the hook's reset value

export default function RouteFlyOverlay({ panelControls, planeControls, isFlying }) {
  return (
    <>
      <motion.div
        className="route-fly-panel"
        initial={{ x: '-130vw' }}
        animate={panelControls}
        aria-hidden="true"
        style={{ pointerEvents: isFlying ? 'auto' : 'none' }}
      />
      {/* x/y/rotate all live on this one motion.div (see
          useRouteFlyTransition.js's flightBob/flightBank) — framer composes
          them into a single transform matrix correctly as long as they're
          all on the same element, which is what gives the gentle bob/bank
          its "gliding" read instead of a flat horizontal slide. The inner
          <img> stays a plain, non-animated child (sizing/filter only). */}
      <motion.div
        className="route-fly-plane-wrap"
        initial={{ x: '-70vw', y: '-50%', rotate: PLANE_INITIAL_ROTATE, opacity: 0 }}
        animate={planeControls}
        aria-hidden="true"
      >
        <img src="/images/route-fly-plane.png" alt="" className="route-fly-plane" />
      </motion.div>
    </>
  );
}
