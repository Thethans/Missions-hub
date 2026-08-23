import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import statsData from '../../data/stats.json';
import { WHISPER_NAMES } from '../../data/whisperNames.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';

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

const LAYERS = [
  { dots: makeLayer(140, 1.7), speed: 0.15, size: 1.1, opacity: 0.25 },
  { dots: makeLayer(90, 4.3), speed: 0.35, size: 1.6, opacity: 0.45 },
  { dots: makeLayer(50, 9.1), speed: 0.6, size: 2.2, opacity: 0.75 }
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

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const fraction = scrollFractionRef.current;
      LAYERS.forEach((layer) => {
        const drift = fraction * layer.speed * height * 1.4;
        layer.dots.forEach((dot) => {
          const px = dot.x * width;
          const py = (dot.y * height * 3 - drift) % (height * 1.4);
          const y = py < 0 ? py + height * 1.4 : py;
          if (y < -20 || y > height + 20) return;
          ctx.beginPath();
          ctx.arc(px, y, layer.size, 0, Math.PI * 2);
          if (dot.lit) {
            ctx.fillStyle = 'rgba(217, 164, 65, 0.95)';
            ctx.shadowColor = 'rgba(217, 164, 65, 0.8)';
            ctx.shadowBlur = 6;
          } else {
            ctx.fillStyle = `rgba(148, 168, 196, ${layer.opacity})`;
            ctx.shadowBlur = 0;
          }
          ctx.fill();
        });
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

function WhisperLabels({ active }) {
  const [labels, setLabels] = useState([]);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!active || prefersReduced) return;
    let id = 0;
    const interval = setInterval(() => {
      const name = WHISPER_NAMES[Math.floor(Math.random() * WHISPER_NAMES.length)];
      const entry = { id: id++, name, x: 10 + Math.random() * 80, y: 15 + Math.random() * 70 };
      setLabels((prev) => [...prev.slice(-4), entry]);
      setTimeout(() => {
        setLabels((prev) => prev.filter((l) => l.id !== entry.id));
      }, 3800);
    }, 1600);
    return () => clearInterval(interval);
  }, [active, prefersReduced]);

  if (prefersReduced) return null;

  return (
    <div className="abyss-whispers" aria-hidden="true">
      {labels.map((l) => (
        <span key={l.id} className="abyss-whisper" style={{ left: `${l.x}%`, top: `${l.y}%` }}>
          {l.name}
        </span>
      ))}
    </div>
  );
}

export default function ChapterAbyss() {
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { amount: 0.1 });
  const prefersReduced = usePrefersReducedMotion();

  const groups = statsData.unreachedGroups.toLocaleString();
  const population = (statsData.unreachedPopulation / 1e9).toFixed(1);

  return (
    <section className="chapter-abyss" ref={sectionRef}>
      <div className="abyss-pin">
        <AbyssCanvas active={inView && !prefersReduced} />
        <div className="abyss-vignette" aria-hidden="true" />
        <WhisperLabels active={inView} />
      </div>
      <div className="abyss-scroll">
        <div className="abyss-open">
          <p>You are about to scroll through a very long silence.</p>
          <p>It is meant to feel long. This is what 4.3 billion people looks like from here.</p>
        </div>
        <div className="abyss-void" aria-hidden="true" />
        <div className="abyss-landing">
          <p className="abyss-landing-kicker">An unreached people group is</p>
          <p className="abyss-landing-def">
            An ethnic or sociological group with no indigenous community of believers with adequate
            numbers and resources to evangelize this people group without outside assistance.
          </p>
          <div className="abyss-landing-stats">
            <div>
              <span className="abyss-landing-number">{groups}</span>
              <span>unreached people groups</span>
            </div>
            <div>
              <span className="abyss-landing-number">{population}B</span>
              <span>people, waiting</span>
            </div>
          </div>
          <p className="abyss-landing-close">
            Every dot you fell through on the way down was real. So is every name that whispered past.
            The silence isn't empty because no one is there — it's empty because almost no one has gone.
          </p>
        </div>
      </div>
    </section>
  );
}
