import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import RouteLine from './RouteLine.jsx';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

const WIDTH = 1000;
const HEIGHT = 500;

function project([lon, lat]) {
  const x = ((lon + 180) / 360) * WIDTH;
  const y = ((90 - lat) / 180) * HEIGHT;
  return [x, y];
}

export default function HeroBackground() {
  const [points, setPoints] = useState([]);
  const prefersReduced = usePrefersReducedMotion();
  const { scrollY } = useScroll();
  // Dots drift slower than the page scroll — subtle depth layer behind the headline.
  const y = useTransform(scrollY, [0, 600], [0, prefersReduced ? 0 : 120]);

  useEffect(() => {
    let cancelled = false;
    fetch('/data/people-groups.geojson')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setPoints(data.features.map((f) => project(f.geometry.coordinates)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="hero-background" aria-hidden="true">
      <motion.svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="xMidYMid slice" style={{ y }}>
        {points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" className="hero-background-dot" />
        ))}
      </motion.svg>
      <RouteLine
        variant="load"
        delay={0.5}
        pathD="M120,360 Q320,180 520,260 T860,140"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="hero-background-route"
      />
    </div>
  );
}
