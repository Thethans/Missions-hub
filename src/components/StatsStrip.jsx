import React, { useEffect, useState } from 'react';

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

  return (
    <section className="stats-strip">
      <div className="stat">
        <span className="stat-number">{stats.groups.toLocaleString()}</span>
        <span className="stat-label">Unreached people groups</span>
      </div>
      <div className="stat">
        <span className="stat-number">{stats.population.toLocaleString()}</span>
        <span className="stat-label">People still waiting to hear</span>
      </div>
      <div className="stat">
        <span className="stat-number">{stats.countries}</span>
        <span className="stat-label">Countries represented</span>
      </div>
    </section>
  );
}
