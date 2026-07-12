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

const DRAMATIC = [0.16, 1, 0.3, 1];

function HeroHeadline() {
  const prefersReduced = usePrefersReducedMotion();
  const wght = useMotionValue(prefersReduced ? 800 : 340);
  const opsz = useMotionValue(prefersReduced ? 100 : 18);
  const fontVariationSettings = useMotionTemplate`'wght' ${wght}, 'opsz' ${opsz}, 'WONK' 1`;

  useEffect(() => {
    if (prefersReduced) return;
    // Slow, dramatic bloom: the wordmark swells from a thin, condensed form
    // into its full display weight over ~2s.
    const wghtControls = animate(wght, 800, { duration: 2.1, ease: DRAMATIC });
    const opszControls = animate(opsz, 100, { duration: 2.1, ease: DRAMATIC });
    return () => {
      wghtControls.stop();
      opszControls.stop();
    };
    // wght/opsz are framer-motion `useMotionValue` containers — stable
    // identity across renders (like a ref), safe to list here.
  }, [prefersReduced, wght, opsz]);

  return (
    <motion.h1
      className="hero-wordmark"
      style={{ fontVariationSettings }}
      variants={heroRise}
    >
      Fielded
    </motion.h1>
  );
}

// Big, slow, staggered entrance for the hero — each line rises and clears
// in sequence for a deliberate, cinematic open.
const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.22, delayChildren: 0.15 } }
};

const heroRise = {
  hidden: { opacity: 0, y: 48, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 1.4, ease: DRAMATIC } }
};

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
          variants={heroContainer}
          initial={prefersReduced ? false : 'hidden'}
          animate="show"
        >
          <motion.span className="hero-eyebrow" variants={heroRise}>
            Live map of unreached people groups worldwide
          </motion.span>
          <HeroHeadline />
          <motion.p className="hero-tagline" variants={heroRise}>Get to the field.</motion.p>
          <motion.p variants={heroRise}>
            Find the people still waiting to hear, the agencies who can send you, and everything in between.
          </motion.p>
          <motion.div variants={heroRise}>
            <Link to="/quiz" className="cta-button">Take the quiz</Link>
          </motion.div>
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
