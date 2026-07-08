import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { MapPin, MagnifyingGlass, ListChecks, PaperPlaneTilt } from '@phosphor-icons/react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

// Scrollytelling section: a sticky navy panel (dot-field texture, no hard
// box edges) where a dashed route line draws in tied to scroll progress,
// waypoint dots light up as the line reaches them, and a per-step icon +
// caption crossfades to match. Step text scrolls past on the right, with a
// vertical progress thread running down the gaps between steps so the
// empty space between blocks still carries motion.
const STEPS = [
  {
    n: '01',
    title: 'See where the need is',
    desc: 'Start on the map. Every point is a real people group from Joshua Project — red means little to no access to the gospel in their own language and culture.',
    icon: MapPin
  },
  {
    n: '02',
    title: 'Find agencies worth a conversation',
    desc: 'Answer seven questions and get matched against 14 real sending agencies — with an honest breakdown of what matched and what to ask them directly.',
    icon: MagnifyingGlass
  },
  {
    n: '03',
    title: 'Prepare without dropping things',
    desc: 'Work through a pre-field checklist tailored to your role and destination, with your progress saved as you go.',
    icon: ListChecks
  },
  {
    n: '04',
    title: 'Get to the field',
    desc: 'The goal was never the website. Talk to real people at the agencies that fit, and go.',
    icon: PaperPlaneTilt
  }
];

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
  const threadHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const [activeIndex, setActiveIndex] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setActiveIndex(Math.min(STEPS.length - 1, Math.floor(v * STEPS.length)));
  });

  return (
    <section className="journey" ref={sectionRef}>
      <div className="journey-sticky">
        <div className="journey-panel">
          <div className="journey-panel-glow" />
          <svg className="journey-panel-route" viewBox="0 0 440 360" aria-hidden="true">
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
          <div className="journey-panel-icon">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Icon
                  key={step.n}
                  weight="light"
                  className="journey-panel-icon-glyph"
                  style={{ opacity: i === activeIndex ? 1 : 0 }}
                  aria-hidden="true"
                />
              );
            })}
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
