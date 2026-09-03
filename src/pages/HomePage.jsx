import React, { useEffect, useRef, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { m, useMotionValue, useMotionTemplate, animate, useScroll, useTransform } from 'framer-motion';
import { CaretDown } from '@phosphor-icons/react';
import ColdOpen from '../components/story/ColdOpen.jsx';
import ChapterCommand from '../components/story/ChapterCommand.jsx';
import ChapterAbyss from '../components/story/ChapterAbyss.jsx';
import ChapterPattern from '../components/story/ChapterPattern.jsx';
import ChapterCost from '../components/story/ChapterCost.jsx';
import StoryFinale from '../components/story/StoryFinale.jsx';
import Footer from '../components/Footer.jsx';
import HeroBackground from '../components/HeroBackground.jsx';
import SectionDivider from '../components/SectionDivider.jsx';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import usePageMeta from '../hooks/usePageMeta.js';
import useMagnetic from '../hooks/useMagnetic.js';

// Lazy, same reasoning as MapPage.jsx's WorldMap split: this pulls in
// maplibre-gl, the heaviest dependency in the app, and bundling it inline
// would force the whole story-chapter chunk above it to wait on maplibre
// evaluating before any of it could paint.
const LandingMapPreview = lazy(() => import('../components/LandingMapPreview.jsx'));

const DRAMATIC = [0.16, 1, 0.3, 1];

function HeroHeadline() {
  const prefersReduced = usePrefersReducedMotion();
  // Starts further from its resting weight/width than the rest of the hero's
  // bloom (250/12 vs the old 340/18) and runs longer (2.6s vs 2.1s) — the
  // wordmark is the one element that gets its own, more theatrical entrance;
  // everything else around it still uses the snappier heroRise timing.
  const wght = useMotionValue(prefersReduced ? 800 : 250);
  const opsz = useMotionValue(prefersReduced ? 100 : 12);
  const fontVariationSettings = useMotionTemplate`'wght' ${wght}, 'opsz' ${opsz}, 'WONK' 1`;

  useEffect(() => {
    if (prefersReduced) return;
    // Slow, dramatic bloom: the wordmark swells from a thin, condensed form
    // into its full display weight over ~2.6s.
    const wghtControls = animate(wght, 800, { duration: 2.6, ease: DRAMATIC });
    const opszControls = animate(opsz, 100, { duration: 2.6, ease: DRAMATIC });
    return () => {
      wghtControls.stop();
      opszControls.stop();
    };
    // wght/opsz are framer-motion `useMotionValue` containers — stable
    // identity across renders (like a ref), safe to list here.
  }, [prefersReduced, wght, opsz]);

  return (
    <m.h1
      className="hero-wordmark"
      data-reveal
      // scripts/prerender.js captures the static snapshot ~2s after load,
      // partway through this element's 2.6s weight bloom — so without this,
      // the baked-in inline font-variation-settings is whatever mid-animation
      // value Puppeteer happened to catch (already heavier than the CSS
      // default below), not the thin starting value real hydration re-mounts
      // to. That mismatch is invisible on a fast connection (hydration
      // overwrites it in milliseconds) but stands out badly on a slow one:
      // visitors see the heavier prerendered frame, then a visible snap back
      // to thin, then the whole bloom replays. data-hydration-reset="style"
      // strips the baked inline style before capture so the static HTML
      // already matches the CSS default (also thin) — see .hero-wordmark
      // in styles.css.
      data-hydration-reset="style"
      style={{ fontVariationSettings }}
      variants={heroWordmarkRise}
    >
      Fielded
      <span className="visually-hidden"> — a live map of unreached people groups and a mission-agency matcher</span>
    </m.h1>
  );
}

// Staggered entrance for the hero — each line rises and clears in sequence
// for a deliberate, cinematic open. Kept snappy (not the original 0.22s/1.4s
// stagger/duration) because the hero tagline is this page's LCP element:
// Lighthouse traced ~3.5s of "element render delay" directly to this
// choreography holding it at opacity 0 while earlier siblings animated in.
const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

const heroRise = {
  hidden: { opacity: 0, y: 48, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: DRAMATIC } }
};

// The wordmark's own entrance — a bigger drop and a much deeper starting
// scale than heroRise (0.68 vs 0.985), so it visibly grows into place
// rather than just fading up like its siblings. Independent duration from
// heroRise, but staggerChildren still controls *when* it starts (see
// heroContainer) so this doesn't reintroduce the LCP delay the tightened
// stagger timing above was written to fix.
const heroWordmarkRise = {
  hidden: { opacity: 0, y: 90, scale: 0.68 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 110, damping: 15, mass: 1 }
  }
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
        <m.div
          className="hero-zoom"
          style={prefersReduced ? undefined : { opacity: heroOpacity, scale: heroScale }}
        >
          <HeroBackground />
          <div className="hero-scrim" aria-hidden="true" />
          <m.div
            className="hero-content"
            variants={heroContainer}
            initial={prefersReduced ? false : 'hidden'}
            animate="show"
          >
            <m.span className="hero-eyebrow" data-reveal variants={heroRise}>
              Live map of unreached people groups worldwide
            </m.span>
            <HeroHeadline />
            <m.p className="hero-tagline" data-reveal variants={heroRise}>Get to the field.</m.p>
            <m.p data-reveal variants={heroRise}>
              Find the people still waiting to hear, the agencies who can send you, and everything in between.
            </m.p>
            <m.div className="hero-cta-row" data-reveal variants={heroRise}>
              <m.span ref={ctaMagnetic.ref} style={ctaMagnetic.style} className="magnetic-wrap">
                <Link to="/quiz" className="cta-button cta-button--go">Take the quiz</Link>
              </m.span>
              {/* Not everyone who lands here is ready to answer 8 questions
                  yet — a lighter, no-commitment path into the same data the
                  quiz eventually points back to (the eyebrow above already
                  promises "live map"), so the hero isn't quiz-or-nothing. */}
              <Link to="/map" className="hero-secondary-link">or see the map</Link>
            </m.div>
          </m.div>
          {/* Sibling of .hero-content, not a child: it needs to anchor to
              the bottom of the full hero section (via .hero-zoom, which
              spans .hero's whole box), not to .hero-content's own
              tightly-wrapped, vertically-centered bounding box — nesting it
              inside .hero-content would position it just under the CTA row
              instead of at the section's actual bottom edge.
              aria-hidden: purely an affordance hint that the page keeps
              going below the fold — every real "where can I go" path
              already exists as the quiz/map links above and the nav, so a
              screen-reader user loses nothing by not hearing this. Plain
              div, not an m.div: the CSS bounce (gated by prefers-reduced-
              motion in styles.css) already carries all the motion this
              needs — a scripted entrance on top of it was firing
              unreliably against the hero's own scroll-linked re-renders
              and added nothing a static-then-bouncing icon doesn't. */}
          <div className="hero-scroll-hint" aria-hidden="true">
            <CaretDown size={20} weight="bold" />
          </div>
        </m.div>
      </section>
      <ColdOpen />
      <SectionDivider from="var(--ink-navy)" to="var(--atlas-paper)" />
      <ChapterCommand />
      <SectionDivider from="var(--atlas-paper)" to="var(--ink-navy)" />
      <ChapterAbyss />
      <SectionDivider from="var(--ink-navy)" to="var(--atlas-paper)" />
      <ChapterPattern />
      {/* No divider here: ChapterPattern, ChapterCost, and StoryFinale are
          all atlas-paper — the divider belongs at the one real color change,
          right before the map preview's dark canvas. */}
      <ChapterCost />
      <StoryFinale />
      <SectionDivider from="var(--atlas-paper)" to="var(--ink-navy)" />
      <Suspense fallback={<p className="landing-map-suspense-fallback" role="status">Loading the map&hellip;</p>}>
        <LandingMapPreview />
      </Suspense>
      <Footer />
    </>
  );
}
