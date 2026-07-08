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
    fetch('/data/people-groups.geojson')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const unreached = data.features.filter((f) => f.properties.progressStatus === 'unreached');
        const population = unreached.reduce((sum, f) => sum + (f.properties.population || 0), 0);
        const countries = new Set(unreached.map((f) => f.properties.country));
        setStats({ groups: unreached.length, population, countries: countries.size });
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
