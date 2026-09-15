import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import statsData from '../../data/stats.json';
import ChapterTitle from './ChapterTitle.jsx';
import VariableBloom from './VariableBloom.jsx';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';

// Dynamic import, not a static one: unreachedNames.js is ~270KB of real
// group names (see scripts/generate-unreached-names.js), and HomePage isn't
// code-split from the app's shared entry (see App.jsx's own "everything but
// the landing page" comment) — a static import here would land in the one
// JS chunk every route pays for, not just the homepage.
//
// Gated on `active` (ChapterAbyss's own in-view signal), not fired on raw
// mount: ChapterAbyss itself mounts immediately with the rest of the
// homepage, so an unconditional import here used to fetch this chunk AND
// force the browser to line-break/column-layout all 255K+ characters of it
// (see .abyss-namewall-text's CSS columns) during initial page load, on
// every visit — including ones that never scroll this far. Waiting for
// `active` defers both the fetch and that layout cost to when the reader
// has actually scrolled into the section, using the void spacer's own long
// scroll runway as the lead time instead of stealing it from first paint.
function useNameWallText(active) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!active || text) return;
    let cancelled = false;
    import('../../data/unreachedNames.js').then(({ UNREACHED_NAMES }) => {
      // One string, not 9,045 React-managed elements — the whole point of
      // the wall is real density, and a single text node is cheap to
      // render and cheap to drift via one transform regardless of how
      // much text is inside it.
      if (!cancelled) setText(UNREACHED_NAMES.join('   ·   '));
    });
    return () => { cancelled = true; };
  }, [active, text]);
  return text;
}

// See spec_2.md's "Chapter II, the Abyss" section for the full design
// rationale — this is a direct port of that structure, not a
// reinterpretation:
//
// .chapter-abyss is a CSS Grid with a single cell. .abyss-pin (the canvas +
// vignette + whisper layer) is position:sticky, height:100vh, and sits
// BEHIND .abyss-scroll's own text content (z-index), which is much taller
// (~320vh: a 66vh open beat + a 180vh empty .abyss-void spacer + the
// landing content) and scrolls normally in the same grid cell. The pinned
// canvas shows through the empty void as the reader scrolls past real
// emptiness — that's what makes the section feel like falling rather than
// just scrolling past a dark section. Once .abyss-scroll's own height is
// exhausted, the sticky pin releases naturally as the chapter ends.
//
// Three deterministic (sine-seeded, not Math.random — see JourneySection's
// PARTICLES/HeroBackground's AMBIENT_PARTICLES for the same convention, so
// SSR/prerender output doesn't flicker on hydration) parallax dot layers
// drift at different depths/speeds. A small, explicitly artistic fraction
// per layer (1-5%) is "lit" — this is a design metaphor, not a literal
// reached/unreached ratio; the real numbers (9,045 / population) are the
// ones actually pulled from stats.json below.
function makeLayer(count, seed) {
  return Array.from({ length: count }, (_, i) => {
    const t = i / count;
    return {
      x: ((Math.sin(seed + i * 12.9898) * 43758.5453) % 1 + 1) % 1,
      y: ((Math.sin(seed + i * 78.233) * 12543.213) % 1 + 1) % 1,
      lit: i % Math.round(count / (count * 0.03 + 1)) === 0 && t < 0.05
    };
  });
}

// Split lit/dim once at module load rather than filtering every draw() call
// — dot membership never changes, only position — so the per-frame cost
// below is two ctx.fillStyle/shadow writes per layer instead of one per
// dot (up to ~280 canvas state writes/frame just to set the same handful
// of values over and over).
function withLitSplit(layer) {
  return { ...layer, litDots: layer.dots.filter((d) => d.lit), dimDots: layer.dots.filter((d) => !d.lit) };
}

const LAYERS = [
  withLitSplit({ dots: makeLayer(140, 1.7), speed: 0.15, size: 1.1, opacity: 0.25 }),
  withLitSplit({ dots: makeLayer(90, 4.3), speed: 0.35, size: 1.6, opacity: 0.45 }),
  withLitSplit({ dots: makeLayer(50, 9.1), speed: 0.6, size: 2.2, opacity: 0.75 })
];

function AbyssCanvas({ active }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const scrollFractionRef = useRef(0);
  const sectionElRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    sectionElRef.current = canvasRef.current?.closest('.chapter-abyss') || null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function onScroll() {
      const el = sectionElRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const fraction = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      scrollFractionRef.current = fraction;
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    function drawDot(dot, layer, fraction) {
      const drift = fraction * layer.speed * height * 1.4;
      const px = dot.x * width;
      const py = (dot.y * height * 3 - drift) % (height * 1.4);
      const y = py < 0 ? py + height * 1.4 : py;
      if (y < -20 || y > height + 20) return;
      ctx.beginPath();
      ctx.arc(px, y, layer.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Two passes per layer instead of one ctx.fillStyle/shadow write per
    // dot (see withLitSplit above) — canvas context state changes are real
    // GPU-side cost, and every dim dot was previously paying for a
    // shadowBlur reset it never used.
    function draw() {
      ctx.clearRect(0, 0, width, height);
      const fraction = scrollFractionRef.current;
      LAYERS.forEach((layer) => {
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(148, 168, 196, ${layer.opacity})`;
        layer.dimDots.forEach((dot) => drawDot(dot, layer, fraction));

        if (layer.litDots.length > 0) {
          ctx.fillStyle = 'rgba(217, 164, 65, 0.95)';
          ctx.shadowColor = 'rgba(217, 164, 65, 0.8)';
          ctx.shadowBlur = 6;
          layer.litDots.forEach((dot) => drawDot(dot, layer, fraction));
        }
      });
      rafRef.current = requestAnimationFrame(draw);
    }

    if (prefersReduced) {
      draw();
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, prefersReduced]);

  return <canvas ref={canvasRef} className="abyss-field" aria-hidden="true" />;
}

// Replaces the old "5 names at a time, ephemeral" whisper effect with the
// real, full list — dense small-type columns that drift slowly upward as
// the reader scrolls through the void, same scroll-fraction mechanic
// AbyssCanvas already uses for its dot layers (one shared "falling past
// real names" read, not two unrelated effects sharing a section). Not
// individually readable at a glance by design — the point, per the closing
// line below ("every name that whispered past... was real"), is that
// there's too much real density here to take in at once, which a curated
// handful of legible names never communicated.
function NameWall({ active }) {
  const wallRef = useRef(null);
  const rafRef = useRef(null);
  const sectionElRef = useRef(null);
  const prefersReduced = usePrefersReducedMotion();
  const nameWallText = useNameWallText(active);

  useEffect(() => {
    sectionElRef.current = wallRef.current?.closest('.chapter-abyss') || null;
  }, []);

  useEffect(() => {
    const wall = wallRef.current;
    if (!wall || !active || prefersReduced) return;

    function tick() {
      const el = sectionElRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const fraction = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
        wall.style.transform = `translateY(${-fraction * 35}%)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [active, prefersReduced]);

  return (
    <div className="abyss-namewall" aria-hidden="true">
      {/* data-hydration-reset="children": this text starts empty and only
          fills in once the ~270KB unreachedNames.js chunk resolves (see
          useNameWallText above), well after prerender's capture. Stripping
          it here keeps the prerendered snapshot matching a real visitor's
          pre-effect hydration render (same convention prerender.js already
          uses for MapLibre/cobe's imperative DOM) instead of shipping all
          9,045 names as static HTML on every homepage request. */}
      <div ref={wallRef} className="abyss-namewall-text" data-hydration-reset="children">
        {nameWallText}
      </div>
    </div>
  );
}

// The stats/definition block is identical content in both the animated and
// static paths — same markup, same classes (.abyss-landing-stats etc. don't
// depend on the scroll mechanics, so they're reused as-is rather than
// duplicated with a second set of class names).
function AbyssStats({ groups, population }) {
  return (
    <div className="abyss-landing-stats">
      <div>
        <VariableBloom className="abyss-landing-number" variant="numeral">{groups}</VariableBloom>
        <span>unreached people groups</span>
      </div>
      <div>
        <VariableBloom className="abyss-landing-number" variant="numeral">{population}B</VariableBloom>
        <span>people, waiting</span>
      </div>
    </div>
  );
}

// prefers-reduced-motion path: the animated version's entire point is that
// its ~320vh of scroll distance (mostly .abyss-void, an intentionally near-
// empty spacer under a pinned canvas) makes the reader feel the scale of
// "4.3 billion, one at a time" physically, not just read it as a number.
// That's exactly the kind of effect reduced-motion users have opted out of
// — for them this renders as extra scroll distance with no payoff, not
// restraint. So this isn't the same content with the animation switched
// off; it's the same facts (same stats, same definition, same source
// data) laid out as a normal, short, static panel — no sticky pin, no void
// spacer, no canvas/name-wall (both purely decorative and only meaningful
// as motion). Same <h2> chapter heading and reading order either way, so
// the surrounding page's heading hierarchy and narrative sequence don't
// depend on which path rendered.
function AbyssStatic({ groups, population }) {
  return (
    <section className="chapter-abyss chapter-abyss--static">
      <div className="abyss-text-panel">
        <ChapterTitle number="II" title="The Abyss" />
        <p className="abyss-landing-def">
          It represents {population} billion people who currently have no access to the gospel in
          their own language and culture — {groups} distinct unreached people groups.
        </p>
        <p className="abyss-landing-kicker">An unreached people group is</p>
        <p className="abyss-landing-def">
          A people group with no adequate indigenous community of believers to reach it without
          outside help.
        </p>
        <AbyssStats groups={groups} population={population} />
        <p className="abyss-landing-close">
          Every one of those {groups} groups is real, drawn from an actual list — not a scroll
          effect. That's what "unreached" looks like at scale.
        </p>
      </div>
    </section>
  );
}

export default function ChapterAbyss() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { amount: 0.1 });
  const prefersReduced = usePrefersReducedMotion();

  const groups = statsData.unreachedGroups.toLocaleString();
  const population = (statsData.unreachedPopulation / 1e9).toFixed(1);

  if (prefersReduced) {
    return <AbyssStatic groups={groups} population={population} />;
  }

  return (
    <section className="chapter-abyss" ref={sectionRef}>
      <div className="abyss-pin">
        <AbyssCanvas active={inView} />
        <div className="abyss-vignette" aria-hidden="true" />
        <NameWall active={inView} />
      </div>
      <div className="abyss-scroll">
        <div className="abyss-open">
          <div className="abyss-text-panel">
            <ChapterTitle number="II" title="The Abyss" />
            <p>What follows is a long stretch of scrolling with very little on the screen.</p>
            <p>It represents {population} billion people who currently have no access to the gospel in their own language and culture.</p>
          </div>
        </div>
        <div className="abyss-void" aria-hidden="true" />
        <div className="abyss-landing">
          <div className="abyss-text-panel">
            <p className="abyss-landing-kicker">An unreached people group is</p>
            <p className="abyss-landing-def">
              A people group with no adequate indigenous community of believers to reach it without
              outside help.
            </p>
            <AbyssStats groups={groups} population={population} />
            <p className="abyss-landing-close">
              Every people group you scrolled past just now is real, drawn from an actual list of{' '}
              {groups} unreached groups. That emptiness didn't mean the people aren't there. It meant
              almost no one has gone to them.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
