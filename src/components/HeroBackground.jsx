import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import atlas from '../data/heroAtlas.json';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import useMatchMedia from '../hooks/useMatchMedia.js';

// "The Living Atlas" (HERO section of FIELDED_PROFESSIONALIZATION_AUDIT.md):
// a dot-matrix world map built from the site's own real people-group data
// (see scripts/generate-hero-dots.js — src/data/heroAtlas.json is its
// static, build-time-only output, never computed client-side), with two
// motion layers: a pulse layer at real unreached-people-group coordinates,
// and a route layer of illustrative sending-city → unreached-region arcs
// with IBM Plex Mono coordinate labels. Pure inline SVG + CSS animation —
// no canvas, no three.js, no new dependency. Replaces the old hand-placed
// DotConstellation + cobe Globe composition; Globe.jsx itself is untouched
// and unused for now, reserved for a future flagship moment per the spec.

// Matches the existing .hero-dots mobile breakpoint in styles.css.
const MOBILE_QUERY = '(max-width: 768px)';

// Cursor parallax only makes sense for a device that actually has a cursor
// hovering without touching — coarse/touch pointers get no mousemove events
// worth reacting to anyway.
const FINE_POINTER_QUERY = '(pointer: fine)';

// Pure atmosphere, independent of the real pulse-dot data — same
// sine-jitter-not-Math.random() convention as JourneySection's PARTICLES so
// the drift is stable across renders instead of reshuffling on every mount.
const AMBIENT_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  left: `${(i * 37 + 8) % 100}%`,
  dx: Math.round(Math.sin(i * 1.9) * 40),
  duration: 14 + (i % 4) * 3,
  delay: -(i * 3.1),
  teal: i % 2 === 0
}));

function AmbientParticles() {
  return (
    <div className="hero-particles">
      {AMBIENT_PARTICLES.map((p, i) => (
        <span
          key={i}
          className={`hero-particle${p.teal ? '' : ' hero-particle--paper'}`}
          style={{ left: p.left, '--dx': `${p.dx}px`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}
        />
      ))}
    </div>
  );
}

// The "10/40 Window" is real missiological shorthand for the latitude band
// (10°N-40°N) historically cited as containing the bulk of the world's
// unreached peoples — cropping the mobile viewBox to it isn't an arbitrary
// framing choice, it's the same concept the rest of this product is built
// around. Computed from generate-hero-dots.js's own projection constants
// (LAT_MIN -58, LAT_MAX 76, height 400): y for lat=40 is ~104, for lat=10
// is ~193, so this crop keeps that band roughly centered with padding.
const MOBILE_VIEWBOX = '0 70 800 260';

// The base dot-matrix — the texture that traces the continents themselves —
// stays a plain, uncolored white/paper tint regardless of what real people
// group landed in each cell; status only shows up on the pulse layer below.
function Dots({ dots, mobile }) {
  const visible = mobile ? dots.filter((_, i) => i % 2 === 0) : dots;
  return (
    <g className="hero-atlas-dots">
      {visible.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={1.6} />
      ))}
    </g>
  );
}

// The pulses that fade in and out are the layer carrying real status —
// colored the same way the live map colors real people groups (see
// WorldMap.jsx's CIRCLE_COLOR), straight from each pulse's real
// progressStatus (src/data/heroAtlas.json, built by
// scripts/generate-hero-dots.js), never an invented palette.
function Pulses({ pulses, animate }) {
  return (
    <g className="hero-atlas-pulses">
      {pulses.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={1.4}
          className={`hero-atlas-pulse hero-atlas-pulse--${p.status || 'unreached'}`}
          style={animate ? { animationDelay: `${p.delayFraction * 3.5}s` } : undefined}
        />
      ))}
    </g>
  );
}

function Routes({ routes, animate }) {
  return (
    <g className="hero-atlas-routes">
      {routes.map((r, i) => (
        <g key={i} style={animate ? { animationDelay: `${i * 1.3}s` } : undefined}>
          <path
            d={`M ${r.from.x} ${r.from.y} Q ${r.controlX} ${r.controlY} ${r.to.x} ${r.to.y}`}
            className="hero-atlas-route"
          />
          <text x={r.from.x} y={r.from.y - 10} className="hero-atlas-coord" textAnchor="middle">
            {r.from.label}
          </text>
          <text x={r.to.x} y={r.to.y - 10} className="hero-atlas-coord" textAnchor="middle">
            {r.to.label}
          </text>
        </g>
      ))}
    </g>
  );
}

export default function HeroBackground() {
  const prefersReduced = usePrefersReducedMotion();
  const mobile = useMatchMedia(MOBILE_QUERY);
  const finePointer = useMatchMedia(FINE_POINTER_QUERY);
  const containerRef = useRef(null);

  // Cursor parallax: the atlas drifts against the pointer, a depth cue that
  // makes the map read as a live, responsive surface rather than a flat
  // background image. Two layers move at different rates off the same
  // spring — dots (the farthest, most numerous layer) drift least, pulses
  // and routes (the layer carrying the real data) drift most — so the
  // parallax reads as actual depth rather than the whole graphic sliding
  // as one flat plane. Spring-smoothed so it trails the cursor instead of
  // snapping to it. Fine-pointer desktops only, off entirely under reduced
  // motion.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 34, damping: 18, mass: 0.7 });
  const springY = useSpring(rawY, { stiffness: 34, damping: 18, mass: 0.7 });
  const bgX = useTransform(springX, (v) => v * 0.45);
  const bgY = useTransform(springY, (v) => v * 0.45);
  const fgX = useTransform(springX, (v) => v * 1.35);
  const fgY = useTransform(springY, (v) => v * 1.35);

  useEffect(() => {
    if (prefersReduced || !finePointer) return;
    const el = containerRef.current;
    if (!el) return;
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rawX.set(px * -32);
      rawY.set(py * -22);
    };
    el.addEventListener('mousemove', handleMove);
    return () => el.removeEventListener('mousemove', handleMove);
  }, [prefersReduced, finePointer, rawX, rawY]);

  const parallaxActive = !prefersReduced && finePointer;

  return (
    <div className="hero-background" ref={containerRef} aria-hidden="true">
      <svg
        className={`hero-atlas${prefersReduced ? ' hero-atlas--static' : ''}`}
        viewBox={mobile ? MOBILE_VIEWBOX : atlas.viewBox}
        preserveAspectRatio="xMidYMid slice"
      >
        <motion.g style={parallaxActive ? { x: bgX, y: bgY } : undefined}>
          <Dots dots={atlas.dots} mobile={mobile} />
        </motion.g>
        <motion.g style={parallaxActive ? { x: fgX, y: fgY } : undefined}>
          <Routes routes={atlas.routes} animate={!prefersReduced} />
          <Pulses pulses={atlas.pulses} animate={!prefersReduced} />
        </motion.g>
      </svg>
      {!prefersReduced && <AmbientParticles />}
    </div>
  );
}
