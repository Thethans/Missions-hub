import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useMotionTemplate, animate } from 'framer-motion';
import StatsStrip from '../components/StatsStrip.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import MapTeaser from '../components/MapTeaser.jsx';
import Footer from '../components/Footer.jsx';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

function HeroHeadline() {
  const prefersReduced = usePrefersReducedMotion();
  const wght = useMotionValue(prefersReduced ? 800 : 500);
  const opsz = useMotionValue(prefersReduced ? 100 : 40);
  const fontVariationSettings = useMotionTemplate`'wght' ${wght}, 'opsz' ${opsz}, 'WONK' 1`;

  useEffect(() => {
    if (prefersReduced) return;
    const wghtControls = animate(wght, 800, { duration: 0.6, ease: 'easeOut' });
    const opszControls = animate(opsz, 100, { duration: 0.6, ease: 'easeOut' });
    return () => {
      wghtControls.stop();
      opszControls.stop();
    };
  }, [prefersReduced]);

  return (
    <motion.h1 style={{ fontVariationSettings }}>
      Get to the field.
    </motion.h1>
  );
}

export default function HomePage() {
  const prefersReduced = usePrefersReducedMotion();

  return (
    <>
      <section className="hero">
        <motion.div
          initial={{ opacity: 0, y: prefersReduced ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <HeroHeadline />
          <p>Find the people still waiting to hear, the agencies who can send you, and everything in between.</p>
          <Link to="/quiz" className="cta-button">Take the quiz</Link>
        </motion.div>
      </section>
      <StatsStrip />
      <HowItWorks />
      <MapTeaser />
      <Footer />
    </>
  );
}
