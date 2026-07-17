import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useMotionTemplate, animate, useScroll, useTransform } from 'framer-motion';
import StatsStrip from '../components/StatsStrip.jsx';
import JourneySection from '../components/JourneySection.jsx';
import Capabilities from '../components/Capabilities.jsx';
import MapTeaser from '../components/MapTeaser.jsx';
import Faq from '../components/Faq.jsx';
import Footer from '../components/Footer.jsx';
import HeroBackground from '../components/HeroBackground.jsx';
import SectionDivider from '../components/SectionDivider.jsx';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import usePageMeta from '../hooks/usePageMeta.js';
import useMagnetic from '../hooks/useMagnetic.js';

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

  // Cinematic exit: as the hero scrolls out from under the viewport, it
  // fades and scales up slightly — reads as pulling back from the map
  // rather than an abrupt cut to the next section. Tracked over exactly the
  // span where the hero moves from filling the viewport top to having fully
  // scrolled past it.
  const heroRef = useRef(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(heroScroll, [0, 1], [1, 0.35]);
  const heroScale = useTransform(heroScroll, [0, 1], [1, 1.12]);

  const ctaMagnetic = useMagnetic();

  return (
    <>
      {/* heroRef stays on this plain, untransformed section — useScroll
          measures it to compute scroll progress. Applying the scale/opacity
          transform to this same element would feed back into that
          measurement (getBoundingClientRect includes CSS transforms), so
          the transform lives on the inner .hero-zoom wrapper instead. */}
      <section className="hero" ref={heroRef}>
        <motion.div
          className="hero-zoom"
          style={prefersReduced ? undefined : { opacity: heroOpacity, scale: heroScale }}
        >
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
              <motion.span ref={ctaMagnetic.ref} style={ctaMagnetic.style} className="magnetic-wrap">
                <Link to="/quiz" className="cta-button">Take the quiz</Link>
              </motion.span>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
      <StatsStrip />
      <JourneySection />
      <SectionDivider from="var(--atlas-paper)" to="var(--ink-navy)" />
      <Capabilities />
      <SectionDivider from="var(--ink-navy)" to="var(--atlas-paper)" />
      <MapTeaser />
      <SectionDivider from="var(--atlas-paper)" to="var(--ink-navy)" />
      <Faq />
      <Footer />
    </>
  );
}
