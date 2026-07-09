import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { JOURNEY_STEPS as STEPS } from '../data/journeySteps.js';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import Globe from './Globe.jsx';

// Scrollytelling section: a sticky navy panel holding a rotating globe (the
// plane orbits locked to its spin) while a per-step caption crossfades to
// match scroll progress. Step text scrolls past on the right, with a
// vertical progress thread running down the gaps between steps so the
// empty space between blocks still carries motion.

export default function JourneySection() {
  const sectionRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 0.7', 'end 0.9'] });
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
          <Globe progress={scrollYProgress} />
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
