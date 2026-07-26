import React from 'react';
import { motion } from 'framer-motion';
import { AirplaneTilt } from '@phosphor-icons/react';

// The visual half of the route transition (see useRouteFlyTransition.js for
// the sequencing/timing). Two independently-animated layers riding the same
// left-to-right pass: a full-viewport navy panel that actually guarantees
// total coverage (the plane icon alone, with all its negative space, never
// could), and a huge plane icon layered on top for the "flies across"
// read. Both are inert (aria-hidden, no focusable content) — this is pure
// transition chrome, never a thing a screen reader or keyboard user needs
// to stop on.
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
      <motion.div
        className="route-fly-plane"
        initial={{ x: '-70vw', y: '-50%', opacity: 0 }}
        animate={planeControls}
        aria-hidden="true"
      >
        <AirplaneTilt weight="fill" />
      </motion.div>
    </>
  );
}
