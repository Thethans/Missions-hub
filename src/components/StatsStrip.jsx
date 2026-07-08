import React, { useEffect, useState } from 'react';
import RevealOnScroll from './RevealOnScroll.jsx';

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
    { number: stats.groups.toLocaleString(), label: 'Unreached people groups' },
    { number: stats.population.toLocaleString(), label: 'People still waiting to hear' },
    { number: stats.countries, label: 'Countries represented' }
  ];

  return (
    <section className="stats-strip">
      {items.map((item, i) => (
        <RevealOnScroll key={item.label} index={i} className="stat">
          <span className="stat-number">{item.number}</span>
          <span className="stat-label">{item.label}</span>
        </RevealOnScroll>
      ))}
    </section>
  );
}
