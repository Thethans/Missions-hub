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
// public/images/route-fly-plane.png: a top-down airplane line-art PNG,
// transparent background, from Pixabay (cdn.pixabay.com/photo/2012/04/14/
// 14/01/airplane-34037_1280.png, uploaded by Clker-Free-Vector-Images) —
// free for commercial use under the Pixabay Content License, no
// attribution required. Recolored from black-on-transparent to
// paper-on-transparent via the CSS invert filter in styles.css since it
// needs to read against the navy panel.
export default function RouteFlyOverlay({ panelControls, planeControls, isFlying }) {
  return (
    <>
      <motion.div
        className="route-fly-panel"
        initial={{ x: '-100%' }}
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
        initial={{ x: '-70vw', y: '-50%', rotate: -4, opacity: 0 }}
        animate={planeControls}
        aria-hidden="true"
      >
        <img src="/images/route-fly-plane.png" alt="" className="route-fly-plane" />
      </motion.div>
    </>
  );
}
