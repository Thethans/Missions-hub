import React, { Suspense, lazy } from 'react';
import { useMotionValue } from 'framer-motion';

// cobe (the WebGL globe renderer) is a meaningful chunk of JS that only this
// one component needs — lazy-loading it keeps it out of the home page's
// initial bundle. The hero's ink-navy background + scrim are already in
// place the instant this mounts, so a null fallback (globe just fades in a
// beat later) reads as intentional rather than a loading flash.
const Globe = lazy(() => import('./Globe.jsx'));

// A big, slowly rotating Earth with a plane in continuous orbit — the first
// thing anyone sees on the site. Globe's own idle auto-spin (it always
// nudges phi forward every frame, independent of scroll) is all the motion
// this needs, so `progress` is just a MotionValue that never changes.
export default function HeroBackground() {
  const staticProgress = useMotionValue(0);

  return (
    <div className="hero-background" aria-hidden="true">
      <div className="hero-globe">
        <Suspense fallback={null}>
          <Globe progress={staticProgress} />
        </Suspense>
      </div>
    </div>
  );
}
