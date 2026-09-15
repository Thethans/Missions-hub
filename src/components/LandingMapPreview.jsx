import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroBackground from './HeroBackground.jsx';
import BrandLockup from './BrandMark.jsx';
import QuizCTA from './QuizCTA.jsx';
import statsData from '../data/stats.json';

const OPPORTUNITIES_URL = '/data/opportunities-fallback.json';
// Same source/reasoning as the old LandingMapHeader.jsx: the opportunities
// file only has a broad region string, not per-country data, so country
// count comes from stats.json (the same people-groups dataset the real map
// renders) instead.
const COUNTRY_COUNT = statsData.unreachedCountries;

// Was a real, live MapLibre instance (clustered points, country search,
// flyTo) — genuinely broken in practice: MapLibre's own CSS collided with
// ours on load order (see the removed .landing-map-canvas comment history),
// and the whole thing added maplibre-gl (~800KB) plus a fetch/WebGL-init
// race to every homepage visit just to show a *preview* nobody was meant to
// interact with — the actual map already lives at /map. This is what it
// should have been from the start: a static, real-data hint (the same
// dot-matrix "living atlas" the hero uses, plus real counts) with one clear
// action — go to the real thing.
export default function LandingMapPreview() {
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
      .catch((e) => console.error('LandingMapPreview: could not load opportunities-fallback.json', e));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="landing-map">
      <div className="landing-map-teaser">
        <HeroBackground minimal />
        <div className="landing-map-vignette" aria-hidden="true" />
        <div className="landing-map-teaser-content">
          <BrandLockup expanded />
          <p className="landing-map-teaser-lede">
            Every point on the real map is an actual unreached people group, colored by progress
            status.
          </p>
          {opportunityStats && (
            <div className="landing-map-teaser-stats">
              <div className="landing-map-stat">
                <span className="landing-map-stat-value">{opportunityStats.opportunities.toLocaleString()}</span>
                <span className="landing-map-stat-label">opportunities</span>
              </div>
              <div className="landing-map-stat">
                <span className="landing-map-stat-value">{opportunityStats.agencies}</span>
                <span className="landing-map-stat-label">agencies</span>
              </div>
              <div className="landing-map-stat">
                <span className="landing-map-stat-value">{COUNTRY_COUNT}</span>
                <span className="landing-map-stat-label">countries</span>
              </div>
            </div>
          )}
          <Link to="/map" className="cta-button cta-button--go">Explore the full map</Link>
        </div>
      </div>
      <QuizCTA />
    </section>
  );
}
