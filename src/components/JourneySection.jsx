import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { JOURNEY_STEPS as STEPS } from '../data/journeySteps.js';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import PlaneIcon from './PlaneIcon.jsx';

// Scrollytelling section: a wide "flight lane" fills the left gutter — the
// plane circles continuously (its own idle motion, like a glider riding a
// thermal) while its overall vertical position descends with scroll, rather
// than sitting pinned to a thin line. Waypoint markers are numbered circles
// that fill in solid as the plane passes them.
export default function JourneySection() {
  const sectionRef = useRef(null);
  const planeRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start 0.7', 'end 0.9'] });
  const threadHeight = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollTopRef = useRef(0);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const clamped = Math.min(1, Math.max(0, v));
    scrollTopRef.current = clamped * 100;
    setActiveIndex(Math.min(STEPS.length - 1, Math.floor(clamped * STEPS.length)));
  });

  useEffect(() => {
    if (prefersReduced) return;
    let raf;
    let angle = 0;
    const RX = 34; // circling radius, px — how far it swings across the lane
    const RY = 12; // vertical wobble, px — a little helix lift as it loops
    const tick = () => {
      angle += 0.018;
      const plane = planeRef.current;
      if (plane) {
        const dx = Math.cos(angle) * RX;
        const dy = Math.sin(angle) * RY;
        // Heading follows the tangent of the loop it's tracing, so it banks
        // into the circle instead of floating with a fixed orientation.
        const heading = (Math.atan2(RY * Math.cos(angle), -RX * Math.sin(angle)) * 180) / Math.PI;
        plane.style.top = `${scrollTopRef.current}%`;
        plane.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${heading + 90}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [prefersReduced]);

  return (
    <section className="journey" ref={sectionRef}>
      <div className="journey-steps">
        <div className="journey-flight-lane">
          <div className="journey-thread">
            <motion.div className="journey-thread-fill" style={{ height: prefersReduced ? '100%' : threadHeight }} />
          </div>
          {STEPS.map((step, i) => (
            <JourneyDot key={step.n} index={i} label={step.n} progress={scrollYProgress} prefersReduced={prefersReduced} />
          ))}
          {!prefersReduced && (
            <div ref={planeRef} className="journey-plane">
              <PlaneIcon size={22} />
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
