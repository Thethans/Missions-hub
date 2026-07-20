import React, { useEffect, useRef, useState } from 'react';
import { motion, animate, useInView } from 'framer-motion';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
// Static build-time import (not a runtime fetch) — see the comment in
// scripts/fetch-joshua-project.mjs for why: this is what makes the real
// numbers show up on first paint, in the Puppeteer prerender snapshot, and
// for any no-JS client, none of which would ever see a value that only
// exists after a fetch() resolves.
import statsData from '../data/stats.json';

// A mid-animation glimpse (a slow connection, a fast scroll-past) should
// never show a number that reads as "obviously not done loading" — starting
// the count-up at 85% of the final value means the worst case is "close to
// the real number," never a literal 0.
const COUNT_UP_START_FRACTION = 0.85;

function CountUp({ value }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const prefersReduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || prefersReduced) {
      if (inView) setDisplay(value);
      return;
    }
    const startValue = Math.round(value * COUNT_UP_START_FRACTION);
    const controls = animate(startValue, value, {
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
  const prefersReduced = usePrefersReducedMotion();
  const stats = {
    groups: statsData.unreachedGroups,
    population: statsData.unreachedPopulation,
    countries: statsData.unreachedCountries
  };

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
            initial={prefersReduced ? false : { opacity: 0, y: 20 }}
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
