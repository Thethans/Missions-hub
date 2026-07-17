import React, { useEffect, useRef, useState } from 'react';
import { motion, animate, useInView } from 'framer-motion';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import { getPreloaded, setPreloaded } from '../utils/preloadedData.js';

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
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v))
    });
    return () => controls.stop();
  }, [inView, value, prefersReduced]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

const EASE = [0.16, 1, 0.3, 1];

export default function StatsStrip() {
  const [stats, setStats] = useState(() => getPreloaded('stats') ?? null);

  useEffect(() => {
    if (getPreloaded('stats')) return;
    let cancelled = false;
    fetch('/data/stats.json')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const next = { groups: data.unreachedGroups, population: data.unreachedPopulation, countries: data.unreachedCountries };
        setPreloaded('stats', next);
        setStats(next);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!stats) return null;

  const items = [
    { number: stats.groups, label: 'Unreached people groups', context: 'with little to no gospel access' },
    { number: stats.population, label: 'People still waiting to hear', context: 'across every continent' },
    { number: stats.countries, label: 'Countries represented', context: 'in Joshua Project data' }
  ];

  return (
    <section className="stats-strip">
      <div className="stats-strip-inner">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            className="stat"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
          >
            <span className="stat-number"><CountUp value={item.number} /></span>
            <span className="stat-label">{item.label}</span>
            <span className="stat-context">{item.context}</span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
