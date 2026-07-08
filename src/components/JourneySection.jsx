import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

// Scrollytelling section: a sticky navy panel where a dashed route line
// draws in, tied to scroll progress through the whole section, while the
// step descriptions scroll past on the right. Waypoint dots light up as
// the line reaches them. Reduced motion renders the line fully drawn.
const STEPS = [
  {
    n: '01',
    title: 'See where the need is',
    desc: 'Start on the map. Every point is a real people group from Joshua Project — red means little to no access to the gospel in their own language and culture.'
  },
  {
    n: '02',
    title: 'Find agencies worth a conversation',
    desc: 'Answer seven questions and get matched against 14 real sending agencies — with an honest breakdown of what matched and what to ask them directly.'
  },
  {
    n: '03',
    title: 'Prepare without dropping things',
    desc: 'Work through a pre-field checklist tailored to your role and destination, with your progress saved as you go.'
  },
  {
    n: '04',
    title: 'Get to the field',
    desc: 'The goal was never the website. Talk to real people at the agencies that fit, and go.'
  }
];

// Route path through the panel, with a waypoint per step (path passes
// through each dot; dot positions are hand-placed along the curve).
const PATH = 'M40,320 C90,240 140,290 190,210 C230,150 270,190 320,110 C350,62 380,80 400,48';
const WAYPOINTS = [
  { x: 40, y: 320 },
  { x: 190, y: 210 },
  { x: 320, y: 110 },
  { x: 400, y: 48 }
];

export default function JourneySection() {
  const sectionRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 0.7', 'end 0.9'] });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section className="journey" ref={sectionRef}>
      <div className="journey-sticky">
        <div className="journey-panel">
          <svg viewBox="0 0 440 360" aria-hidden="true">
            <motion.path
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
          <p className="journey-panel-label">The route from calling to field</p>
        </div>
      </div>
      <div className="journey-steps">
        {STEPS.map((step) => (
          <motion.div
            key={step.n}
            className="journey-step"
            initial={{ opacity: prefersReduced ? 1 : 0, y: prefersReduced ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
          >
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
  // Each waypoint activates as the drawn line reaches its share of the path.
  const threshold = index / (WAYPOINTS.length - 1);
  const opacity = useTransform(progress, [Math.max(0, threshold - 0.04), threshold], [0.25, 1]);
  const r = useTransform(progress, [Math.max(0, threshold - 0.04), threshold], [4, 7]);

  if (prefersReduced) {
    return <circle cx={wp.x} cy={wp.y} r={7} fill="var(--atlas-paper)" />;
  }
  return <motion.circle cx={wp.x} cy={wp.y} fill="var(--atlas-paper)" style={{ opacity, r }} />;
}
