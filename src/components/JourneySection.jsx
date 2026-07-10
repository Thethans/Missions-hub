import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { JOURNEY_STEPS as STEPS } from '../data/journeySteps.js';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

// Hand-placed spread (not Math.random on every render) — a sine-based jitter
// so each particle gets a distinct horizontal drift and timing without
// needing real randomness.
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  dx: Math.round(Math.sin(i * 2.4) * 32),
  duration: 3.6 + (i % 5) * 0.7,
  delay: -(i * 0.85),
  teal: i % 3 !== 0
}));

const EASE_DRAMATIC = [0.16, 1, 0.3, 1];

// Scrollytelling section: the left gutter is a glowing "signal cascade" —
// a thick glow-line fills with scroll while a continuous stream of light
// particles falls through it (its own idle motion, always alive even before
// you scroll), and the 4 waypoints are pulsing numbered beacons. Step text
// on the right gets a deliberately big, blurred, staggered entrance.
export default function JourneySection() {
  const sectionRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 0.7', 'end 0.9'] });
  const threadHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <section className="journey" ref={sectionRef}>
      <div className="journey-steps">
        <div className="journey-lane">
          <div className="journey-thread">
            <motion.div className="journey-thread-fill" style={{ height: prefersReduced ? '100%' : threadHeight }} />
          </div>
          {!prefersReduced &&
            PARTICLES.map((p, i) => (
              <span
                key={i}
                className={`journey-particle${p.teal ? '' : ' journey-particle--paper'}`}
                style={{
                  '--dx': `${p.dx}px`,
                  animationDuration: `${p.duration}s`,
                  animationDelay: `${p.delay}s`
                }}
              />
            ))}
          {STEPS.map((step, i) => (
            <JourneyDot key={step.n} index={i} label={step.n} progress={scrollYProgress} prefersReduced={prefersReduced} />
          ))}
        </div>
        {STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            className="journey-step"
            initial={prefersReduced ? false : { opacity: 0, y: 60, scale: 0.94, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8, ease: EASE_DRAMATIC }}
          >
            <span className="journey-step-watermark">{step.n}</span>
            <motion.span
              className="journey-step-number"
              initial={prefersReduced ? false : { opacity: 0, scale: 1.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            >
              {step.n}
            </motion.span>
            <motion.h3
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.16 }}
            >
              {step.title}
            </motion.h3>
            <motion.p
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {step.desc}
            </motion.p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function JourneyDot({ index, label, progress, prefersReduced }) {
  const threshold = index / (STEPS.length - 1);
  const [reached, setReached] = useState(prefersReduced);

  useMotionValueEvent(progress, 'change', (v) => {
    setReached(v >= threshold - 0.02);
  });

  return (
    <div
      className={`journey-dot${reached ? ' journey-dot--reached' : ''}`}
      style={{ top: `${threshold * 100}%` }}
    >
      {label}
    </div>
  );
}
