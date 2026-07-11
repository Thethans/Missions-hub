import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useMotionTemplate, animate } from 'framer-motion';
import StatsStrip from '../components/StatsStrip.jsx';
import JourneySection from '../components/JourneySection.jsx';
import Capabilities from '../components/Capabilities.jsx';
import MapTeaser from '../components/MapTeaser.jsx';
import Faq from '../components/Faq.jsx';
import Footer from '../components/Footer.jsx';
import HeroBackground from '../components/HeroBackground.jsx';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import usePageMeta from '../hooks/usePageMeta.js';

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
    // wght/opsz are framer-motion `useMotionValue` containers — stable
    // identity across renders (like a ref), safe to list here.
  }, [prefersReduced, wght, opsz]);

  return (
    <motion.h1 className="hero-wordmark" style={{ fontVariationSettings }}>
      Fielded
    </motion.h1>
  );
}

export default function HomePage() {
  const prefersReduced = usePrefersReducedMotion();
  usePageMeta({ path: '/' });

  return (
    <>
      <section className="hero">
        <HeroBackground />
        <div className="hero-scrim" aria-hidden="true" />
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: prefersReduced ? 0 : 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <span className="hero-eyebrow">Live map of unreached people groups worldwide</span>
          <HeroHeadline />
          <p className="hero-tagline">Get to the field.</p>
          <p>Find the people still waiting to hear, the agencies who can send you, and everything in between.</p>
          <Link to="/quiz" className="cta-button">Take the quiz</Link>
        </motion.div>
      </section>
      <StatsStrip />
      <JourneySection />
      <Capabilities />
      <MapTeaser />
      <Faq />
      <Footer />
    </>
  );
}
