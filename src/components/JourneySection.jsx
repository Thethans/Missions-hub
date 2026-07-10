import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { JOURNEY_STEPS as STEPS } from '../data/journeySteps.js';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import PlaneIcon from './PlaneIcon.jsx';

// Scrollytelling section: no card, no box — just a vertical thread running
// down the left edge of the steps, filling in as you scroll. The plane rides
// that fill line straight down (nose-first), with waypoint dots marking
// each step as it passes them.
export default function JourneySection() {
  const sectionRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 0.7', 'end 0.9'] });
  const threadHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const [planeTop, setPlaneTop] = useState(0);
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    setPlaneTop(Math.min(1, Math.max(0, v)) * 100);
  });

  return (
    <section className="journey" ref={sectionRef}>
      <div className="journey-steps">
        <div className="journey-thread">
          <motion.div className="journey-thread-fill" style={{ height: prefersReduced ? '100%' : threadHeight }} />
          {STEPS.map((step, i) => (
            <JourneyDot key={step.n} index={i} progress={scrollYProgress} prefersReduced={prefersReduced} />
          ))}
          {!prefersReduced && (
            <div className="journey-plane" style={{ top: `${planeTop}%` }}>
              <PlaneIcon size={20} />
            </div>
          )}
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

function JourneyDot({ index, progress, prefersReduced }) {
  const threshold = index / (STEPS.length - 1);
  const opacity = useTransform(progress, [Math.max(0, threshold - 0.04), threshold], [0.25, 1]);
  const scale = useTransform(progress, [Math.max(0, threshold - 0.04), threshold], [0.7, 1]);

  if (prefersReduced) {
    return <div className="journey-dot" style={{ top: `${threshold * 100}%`, opacity: 1 }} />;
  }
  return <motion.div className="journey-dot" style={{ top: `${threshold * 100}%`, opacity, scale }} />;
}
