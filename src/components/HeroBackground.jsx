import React, { Suspense, lazy } from 'react';
import { useMotionValue } from 'framer-motion';

const Globe = lazy(() => import('./Globe.jsx'));

function DotConstellation({ side }) {
  const dots = side === 'left' ? [
    { cx: 15, cy: 18, r: 1.5, opacity: 0.35 },
    { cx: 42, cy: 12, r: 2, opacity: 0.25 },
    { cx: 68, cy: 30, r: 1, opacity: 0.45 },
    { cx: 25, cy: 45, r: 1.8, opacity: 0.3 },
    { cx: 55, cy: 52, r: 1.2, opacity: 0.4 },
    { cx: 10, cy: 65, r: 2.2, opacity: 0.2 },
    { cx: 48, cy: 70, r: 1, opacity: 0.35 },
    { cx: 72, cy: 60, r: 1.5, opacity: 0.28 },
    { cx: 30, cy: 80, r: 1.8, opacity: 0.22 },
    { cx: 60, cy: 85, r: 1, opacity: 0.38 },
    { cx: 20, cy: 35, r: 0.8, opacity: 0.5 },
    { cx: 75, cy: 42, r: 0.8, opacity: 0.42 },
    { cx: 38, cy: 25, r: 1.3, opacity: 0.32 },
    { cx: 8, cy: 50, r: 1, opacity: 0.28 },
    { cx: 65, cy: 15, r: 0.8, opacity: 0.36 },
    { cx: 50, cy: 38, r: 1.5, opacity: 0.18 },
    { cx: 18, cy: 72, r: 1.2, opacity: 0.3 },
    { cx: 80, cy: 75, r: 1, opacity: 0.2 },
    { cx: 35, cy: 58, r: 0.6, opacity: 0.45 },
    { cx: 62, cy: 48, r: 0.7, opacity: 0.35 },
  ] : [
    { cx: 28, cy: 15, r: 1.5, opacity: 0.3 },
    { cx: 58, cy: 22, r: 2, opacity: 0.22 },
    { cx: 82, cy: 10, r: 1.2, opacity: 0.4 },
    { cx: 35, cy: 40, r: 1, opacity: 0.45 },
    { cx: 70, cy: 35, r: 1.8, opacity: 0.28 },
    { cx: 90, cy: 50, r: 1.5, opacity: 0.35 },
    { cx: 45, cy: 55, r: 2.2, opacity: 0.2 },
    { cx: 20, cy: 60, r: 1, opacity: 0.38 },
    { cx: 65, cy: 68, r: 0.8, opacity: 0.42 },
    { cx: 85, cy: 72, r: 1.3, opacity: 0.25 },
    { cx: 40, cy: 78, r: 1, opacity: 0.32 },
    { cx: 55, cy: 82, r: 1.8, opacity: 0.18 },
    { cx: 75, cy: 88, r: 0.8, opacity: 0.35 },
    { cx: 25, cy: 30, r: 0.7, opacity: 0.5 },
    { cx: 50, cy: 45, r: 1.2, opacity: 0.3 },
    { cx: 80, cy: 28, r: 0.8, opacity: 0.38 },
    { cx: 15, cy: 48, r: 1, opacity: 0.25 },
    { cx: 92, cy: 38, r: 0.6, opacity: 0.45 },
    { cx: 38, cy: 65, r: 1.5, opacity: 0.22 },
    { cx: 72, cy: 55, r: 0.7, opacity: 0.35 },
  ];

  const lines = side === 'left' ? [
    { x1: 15, y1: 18, x2: 42, y2: 12 },
    { x1: 42, y1: 12, x2: 68, y2: 30 },
    { x1: 25, y1: 45, x2: 55, y2: 52 },
    { x1: 55, y1: 52, x2: 72, y2: 60 },
    { x1: 20, y1: 35, x2: 38, y2: 25 },
    { x1: 38, y1: 25, x2: 65, y2: 15 },
    { x1: 10, y1: 65, x2: 30, y2: 80 },
    { x1: 48, y1: 70, x2: 60, y2: 85 },
    { x1: 8, y1: 50, x2: 18, y2: 72 },
    { x1: 35, y1: 58, x2: 50, y2: 38 },
  ] : [
    { x1: 28, y1: 15, x2: 58, y2: 22 },
    { x1: 58, y1: 22, x2: 82, y2: 10 },
    { x1: 35, y1: 40, x2: 70, y2: 35 },
    { x1: 70, y1: 35, x2: 90, y2: 50 },
    { x1: 25, y1: 30, x2: 50, y2: 45 },
    { x1: 45, y1: 55, x2: 65, y2: 68 },
    { x1: 65, y1: 68, x2: 85, y2: 72 },
    { x1: 20, y1: 60, x2: 38, y2: 65 },
    { x1: 80, y1: 28, x2: 92, y2: 38 },
    { x1: 40, y1: 78, x2: 55, y2: 82 },
  ];

  return (
    <svg
      className={`hero-dots hero-dots--${side}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {lines.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="rgba(43, 110, 118, 0.3)" strokeWidth="0.4" />
      ))}
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={d.r}
          fill="rgba(250, 247, 240, 1)" opacity={d.opacity} />
      ))}
    </svg>
  );
}

export default function HeroBackground() {
  const staticProgress = useMotionValue(0);

  return (
    <div className="hero-background" aria-hidden="true">
      <DotConstellation side="left" />
      <div className="hero-globe">
        <Suspense fallback={null}>
          <Globe progress={staticProgress} />
        </Suspense>
      </div>
      <DotConstellation side="right" />
    </div>
  );
}
