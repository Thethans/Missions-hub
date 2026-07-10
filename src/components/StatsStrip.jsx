import React, { useEffect, useRef, useState } from 'react';
import { animate, useInView } from 'framer-motion';
import RevealOnScroll from './RevealOnScroll.jsx';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

// duol-style scroll-triggered counter: counts up from 0 when the number
// first scrolls into view. Reduced motion (or re-renders) shows the final
// value immediately.
function CountUp({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const prefersReduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(prefersReduced ? value : 0);

  useEffect(() => {
    if (!inView || prefersReduced) {
      if (inView) setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.6,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v))
    });
    return () => controls.stop();
  }, [inView, value, prefersReduced]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

export default function StatsStrip() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // A precomputed summary (written alongside the full geojson by
    // scripts/fetch-joshua-project.mjs) — the homepage only needs these
    // three numbers, not the ~16k-feature dataset the map page renders.
    fetch('/data/stats.json')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setStats({ groups: data.unreachedGroups, population: data.unreachedPopulation, countries: data.unreachedCountries });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!stats) return null;

  const items = [
    { number: stats.groups, label: 'Unreached people groups' },
    { number: stats.population, label: 'People still waiting to hear' },
    { number: stats.countries, label: 'Countries represented' }
  ];

  return (
    <section className="stats-strip">
      {items.map((item, i) => (
        <RevealOnScroll key={item.label} index={i} className="stat">
          <span className="stat-number"><CountUp value={item.number} /></span>
          <span className="stat-label">{item.label}</span>
        </RevealOnScroll>
      ))}
    </section>
  );
}
