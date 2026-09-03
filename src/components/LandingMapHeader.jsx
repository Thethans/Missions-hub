import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { m, animate, useInView } from 'framer-motion';
import { MagnifyingGlass } from '@phosphor-icons/react';
import BrandLockup from './BrandMark.jsx';
import statsData from '../data/stats.json';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

const OPPORTUNITIES_URL = '/data/opportunities-fallback.json';
// From the same people-groups dataset the map itself renders (see
// stats.json's own generation) — the opportunities file only has a broad
// region string, not per-country data, so it isn't the source for this one.
const COUNTRY_COUNT = statsData.unreachedCountries;

// Same count-up shape as StatsStrip.jsx's CountUp (useInView + framer-motion
// animate, not a hand-rolled rAF loop) so the landing page has one count-up
// implementation, not two.
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
    const controls = animate(0, value, {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v))
    });
    return () => controls.stop();
  }, [inView, value, prefersReduced]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

export default function LandingMapHeader({ countries, onSelectCountry }) {
  // Fetched, not statically imported — opportunities-fallback.json lives in
  // public/ and is loaded at runtime everywhere else it's used (see
  // OpportunitiesExplorer.template.jsx's FALLBACK_URL), not bundled in.
  const [opportunityStats, setOpportunityStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(OPPORTUNITIES_URL)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setOpportunityStats({
          opportunities: data.length,
          agencies: new Set(data.map((o) => o.agency)).size
        });
      })
      .catch((e) => console.error('LandingMapHeader: could not load opportunities-fallback.json', e));
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCountryChange = (e) => {
    const name = e.target.value;
    if (!name) return;
    const match = countries.find((c) => c.name === name);
    if (match) onSelectCountry(match.coordinates);
  };

  return (
    <div className="landing-map-header">
      <div className="landing-map-header-left">
        <Link to="/" className="landing-map-brand" aria-label="Fielded home">
          <BrandLockup expanded />
        </Link>
        {countries.length > 0 && (
          <label className="landing-map-country-select">
            <span className="visually-hidden">Explore by country</span>
            <select onChange={handleCountryChange} defaultValue="">
              <option value="" disabled>Explore by country</option>
              {countries.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="landing-map-header-right">
        {opportunityStats && (
          <>
            <m.div className="landing-map-stat">
              <span className="landing-map-stat-value"><CountUp value={opportunityStats.opportunities} /></span>
              <span className="landing-map-stat-label">opportunities</span>
            </m.div>
            <m.div className="landing-map-stat">
              <span className="landing-map-stat-value"><CountUp value={opportunityStats.agencies} /></span>
              <span className="landing-map-stat-label">agencies</span>
            </m.div>
          </>
        )}
        <m.div className="landing-map-stat">
          <span className="landing-map-stat-value"><CountUp value={COUNTRY_COUNT} /></span>
          <span className="landing-map-stat-label">countries</span>
        </m.div>
        <Link to="/map" className="landing-map-search-link" aria-label="Search the full map">
          <MagnifyingGlass size={18} weight="bold" />
        </Link>
      </div>
    </div>
  );
}
