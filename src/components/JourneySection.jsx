import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { JOURNEY_STEPS as STEPS } from '../data/journeySteps.js';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import PlaneIcon from './PlaneIcon.jsx';

// Scrollytelling section: a sticky navy panel where a dashed flight path
// draws in tied to scroll progress, a plane actually flies along that path
// (not just a dot), and waypoint pins light up as it passes them. Deliberately
// flat/2D — the hero already has the big 3D rotating globe; this is a
// different, complementary visual (a paper itinerary, not another planet).
// Step text scrolls past on the right, with a vertical progress thread
// running down the gaps between steps.
const VIEW_W = 440;
const VIEW_H = 360;
const PATH = 'M40,320 C90,240 140,290 190,210 C230,150 270,190 320,110 C350,62 380,80 400,48';
const WAYPOINTS = [
  { x: 40, y: 320 },
  { x: 190, y: 210 },
  { x: 320, y: 110 },
  { x: 400, y: 48 }
];

export default function JourneySection() {
  const sectionRef = useRef(null);
  const pathRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 0.7', 'end 0.9'] });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const threadHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const [activeIndex, setActiveIndex] = useState(0);
  const [plane, setPlane] = useState({ x: WAYPOINTS[0].x, y: WAYPOINTS[0].y, angle: 0 });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const clamped = Math.min(1, Math.max(0, v));
    setActiveIndex(Math.min(STEPS.length - 1, Math.floor(clamped * STEPS.length)));

    const svgPath = pathRef.current;
    if (!svgPath) return;
    const total = svgPath.getTotalLength();
    const here = svgPath.getPointAtLength(clamped * total);
    const ahead = svgPath.getPointAtLength(Math.min(total, clamped * total + 1));
    const angle = (Math.atan2(ahead.y - here.y, ahead.x - here.x) * 180) / Math.PI;
    setPlane({ x: here.x, y: here.y, angle });
  });

  return (
    <section className="journey" ref={sectionRef}>
      <div className="journey-sticky">
        <div className="journey-panel">
          <div className="journey-panel-glow" />
          <div className="journey-route-stage">
            <svg className="journey-panel-route" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} aria-hidden="true">
              <motion.path
                ref={pathRef}
                d={PATH}
                fill="none"
                stroke="var(--voyage-teal)"
                strokeWidth="3"
                strokeDasharray="7 8"
                strokeLinecap="round"
                style={prefersReduced ? undefined : { pathLength }}
              />
              {WAYPOINTS.map((wp, i) => (
                <JourneyDot key={i} wp={wp} index={i} progress={scrollYProgress} prefersReduced={prefersReduced} />
              ))}
            </svg>
            {!prefersReduced && (
              <div
                className="journey-plane"
                style={{
                  left: `${(plane.x / VIEW_W) * 100}%`,
                  top: `${(plane.y / VIEW_H) * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${plane.angle + 90}deg)`
                }}
              >
                <PlaneIcon size={22} />
              </div>
            )}
          </div>
          <p className="journey-panel-label">{STEPS[activeIndex].title}</p>
        </div>
      </div>
      <div className="journey-steps">
        <div className="journey-thread">
          <motion.div className="journey-thread-fill" style={{ height: prefersReduced ? '100%' : threadHeight }} />
        </div>
        {STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            className="journey-step"
            initial={{ opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            <span className="journey-step-watermark">{step.n}</span>
            <span className="journey-step-number">{step.n}</span>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function JourneyDot({ wp, index, progress, prefersReduced }) {
  const threshold = index / (WAYPOINTS.length - 1);
  const opacity = useTransform(progress, [Math.max(0, threshold - 0.04), threshold], [0.25, 1]);
  const r = useTransform(progress, [Math.max(0, threshold - 0.04), threshold], [4, 7]);

  if (prefersReduced) {
    return <circle cx={wp.x} cy={wp.y} r={7} fill="var(--atlas-paper)" />;
  }
  return <motion.circle cx={wp.x} cy={wp.y} fill="var(--atlas-paper)" style={{ opacity, r }} />;
}
