import React from 'react';
import { useMotionValue } from 'framer-motion';
import Globe from './Globe.jsx';

// A big, slowly rotating Earth with a plane in continuous orbit — the first
// thing anyone sees on the site. Globe's own idle auto-spin (it always
// nudges phi forward every frame, independent of scroll) is all the motion
// this needs, so `progress` is just a MotionValue that never changes.
export default function HeroBackground() {
  const staticProgress = useMotionValue(0);

  return (
    <div className="hero-background" aria-hidden="true">
      <div className="hero-globe">
        <Globe progress={staticProgress} />
      </div>
    </div>
  );
}
