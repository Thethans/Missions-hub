import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { JOURNEY_STEPS as STEPS } from '../data/journeySteps.js';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

const FALLBACK_FRACTIONS = STEPS.map((_, i) => i / (STEPS.length - 1));

// Hand-placed spread (not Math.random on every render) — a sine-based jitter
// so each particle gets a distinct horizontal drift and timing without
// needing real randomness.
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  dx: Math.round(Math.sin(i * 2.4) * 32),
  duration: 6.5 + (i % 5) * 1.3,
  delay: -(i * 1.5),
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
  const laneRef = useRef(null);
  const stepRefs = useRef([]);
  const [dotFractions, setDotFractions] = useState(FALLBACK_FRACTIONS);
  const prefersReduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 0.7', 'end 0.9'] });
  const threadHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  // Dots are placed to line up with each step's actual rendered center rather
  // than an even 0..1 spread — step heights vary (wrapped text, breakpoints),
  // so measure real layout via offsetTop/offsetHeight (unaffected by the
  // steps' own enter-animation transforms) instead of assuming equal spacing.
  useLayoutEffect(() => {
    function measure() {
      const lane = laneRef.current;
      if (!lane || !lane.offsetHeight) return;
      const laneTop = lane.offsetTop;
      const laneHeight = lane.offsetHeight;
      const fractions = stepRefs.current.map((el) => {
        if (!el) return 0;
        const center = el.offsetTop + el.offsetHeight / 2;
        return (center - laneTop) / laneHeight;
      });
      setDotFractions(fractions);
    }
    measure();
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(measure);
    if (sectionRef.current) ro.observe(sectionRef.current);
    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, []);

  return (
    <section className="journey" ref={sectionRef}>
      <div className="journey-steps">
        <div className="journey-lane" ref={laneRef}>
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
            <JourneyDot
              key={step.n}
              label={step.n}
              fraction={dotFractions[i] ?? FALLBACK_FRACTIONS[i]}
              progress={scrollYProgress}
              prefersReduced={prefersReduced}
            />
          ))}
        </div>
        {STEPS.map((step, i) => (
          <motion.div
            key={step.n}
            className="journey-step"
            ref={(el) => (stepRefs.current[i] = el)}
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

function JourneyDot({ label, fraction, progress, prefersReduced }) {
  const [reached, setReached] = useState(prefersReduced);

  useMotionValueEvent(progress, 'change', (v) => {
    setReached(v >= fraction - 0.02);
  });

  return (
    <div
      className={`journey-dot${reached ? ' journey-dot--reached' : ''}`}
      style={{ top: `${fraction * 100}%` }}
    >
      {label}
    </div>
  );
}
