import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import atlas from '../data/heroAtlas.json';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import useMatchMedia from '../hooks/useMatchMedia.js';

// "The Living Atlas" (HERO section of FIELDED_PROFESSIONALIZATION_AUDIT.md):
// a dot-matrix world map built from the site's own real people-group data
// (see scripts/generate-hero-dots.js — src/data/heroAtlas.json is its
// static, build-time-only output, never computed client-side), with two
// motion layers: a pulse layer at real unreached-people-group coordinates,
// and a route layer of illustrative sending-city → unreached-region arcs
// with IBM Plex Mono coordinate labels. Replaces the old hand-placed
// DotConstellation + cobe Globe composition; Globe.jsx itself is untouched
// and unused for now, reserved for a future flagship moment per the spec.
//
// The static dot field (850 points, none interactive/animated individually)
// is drawn to a single <canvas> instead of one <circle> per dot — at 1,341
// SVG circles across the homepage this was ~76% of the prerendered HTML
// payload and pushed the page past Lighthouse's excessive-DOM-size
// threshold. The route/pulse layers stay real SVG since they're few (43
// elements) and each is individually CSS-animated.

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

const DOT_RADIUS = 1.6;

function parseViewBox(viewBox) {
  const [minX, minY, width, height] = viewBox.split(' ').map(Number);
  return { minX, minY, width, height };
}

// Renders the static dot field to a single canvas instead of one <circle>
// per dot. Manually replicates SVG's preserveAspectRatio="xMidYMid slice"
// (scale to cover, crop overflow, center both axes) so dots stay
// pixel-aligned with the pulse/route layer, which shares this same viewBox
// but stays real SVG (see file-header comment for why).
function DotCanvas({ dots, mobile, viewBox, className }) {
  const canvasRef = useRef(null);
  const visible = mobile ? dots.filter((_, i) => i % 2 === 0) : dots;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Environments without a real 2d context (some test DOMs, canvas-
    // fingerprinting-blocking extensions) get an empty decorative layer
    // instead of a crash — everything else on the hero still renders.
    if (!ctx) return;
    const { minX, minY, width: vbWidth, height: vbHeight } = parseViewBox(viewBox);
    // Reads the live token instead of hardcoding the hex so a change in
    // tokens.css still takes effect here, same as the old `fill: var(...)`.
    const dotColor =
      getComputedStyle(document.documentElement).getPropertyValue('--atlas-paper').trim() || '#faf7f0';

    function draw() {
      const rect = canvas.getBoundingClientRect();
      const cssWidth = rect.width;
      const cssHeight = rect.height;
      if (!cssWidth || !cssHeight) return;
      // Capped at 3x — a literal devicePixelRatio (up to ~4 on some phones)
      // buys no visible sharpness for 1.6px dots but does multiply the
      // canvas backing-store pixel count.
      const dpr = Math.min(window.devicePixelRatio || 1, 3);

      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      const scale = Math.max(cssWidth / vbWidth, cssHeight / vbHeight);
      const offsetX = (cssWidth - vbWidth * scale) / 2;
      const offsetY = (cssHeight - vbHeight * scale) / 2;
      const r = DOT_RADIUS * scale;

      ctx.fillStyle = dotColor;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      for (const d of visible) {
        const x = offsetX + (d.x - minX) * scale;
        const y = offsetY + (d.y - minY) * scale;
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [visible, viewBox]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      // Not read by the draw logic — one attribute (not 850 DOM nodes) so
      // tests can still assert on the desktop/mobile dot count without
      // reintroducing a per-dot DOM element.
      data-dot-count={visible.length}
    />
  );
}

function Pulses({ pulses, animate }) {
  return (
    <g className="hero-atlas-pulses">
      {pulses.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          className="hero-atlas-pulse"
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

  // Cursor parallax: the atlas drifts a few px against the pointer, a
  // subtle depth cue that makes the map read as a live, responsive surface
  // rather than a flat background image. Spring-smoothed so it trails the
  // cursor instead of snapping to it. Fine-pointer desktops only, off
  // entirely under reduced motion.
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springX = useSpring(rawX, { stiffness: 40, damping: 20, mass: 0.6 });
  const springY = useSpring(rawY, { stiffness: 40, damping: 20, mass: 0.6 });

  useEffect(() => {
    if (prefersReduced || !finePointer) return;
    const el = containerRef.current;
    if (!el) return;
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rawX.set(px * -14);
      rawY.set(py * -10);
    };
    el.addEventListener('mousemove', handleMove);
    return () => el.removeEventListener('mousemove', handleMove);
  }, [prefersReduced, finePointer, rawX, rawY]);

  const viewBox = mobile ? MOBILE_VIEWBOX : atlas.viewBox;

  return (
    <div className="hero-background" ref={containerRef} aria-hidden="true">
      <motion.div
        className="hero-atlas-wrap"
        style={prefersReduced || !finePointer ? undefined : { x: springX, y: springY }}
      >
        <DotCanvas
          dots={atlas.dots}
          mobile={mobile}
          viewBox={viewBox}
          className={`hero-atlas${prefersReduced ? ' hero-atlas--static' : ''}`}
        />
        <svg
          className={`hero-atlas${prefersReduced ? ' hero-atlas--static' : ''}`}
          viewBox={viewBox}
          preserveAspectRatio="xMidYMid slice"
        >
          <Routes routes={atlas.routes} animate={!prefersReduced} />
          <Pulses pulses={atlas.pulses} animate={!prefersReduced} />
        </svg>
      </motion.div>
      {!prefersReduced && <AmbientParticles />}
    </div>
  );
}
