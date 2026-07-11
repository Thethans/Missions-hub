import React, { useEffect, useRef } from 'react';
import createGlobe from 'cobe';
import { useMotionValueEvent } from 'framer-motion';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';
import PlaneIcon from './PlaneIcon.jsx';

const THETA = 0.32;
const ORBIT_TILT = 32; // degrees of latitude the orbit swings between
const ORBIT_ELEVATION = 0.16; // how far above the surface the orbit sits
const ORBIT_SPEED = 2.4; // orbit sweeps this many times faster than the globe's own phi

// Converts a lat/lon (degrees) to a point on the unit sphere — same
// convention cobe uses internally for markers, so it lines up with the
// rendered map exactly.
function toSphere(lat, lon) {
  const r = (lat * Math.PI) / 180;
  const a = (lon * Math.PI) / 180 - Math.PI;
  const cosr = Math.cos(r);
  return [-cosr * Math.cos(a), Math.sin(r), cosr * Math.sin(a)];
}

// Replicates cobe's camera transform (phi/theta rotation + projection) so a
// point orbiting the globe lines up pixel-for-pixel with the rendered sphere
// — including going behind it. Returns normalized [0,1] stage coordinates
// plus a depth value (negative = around the back, hidden).
function project(lat, lon, phi, elevation) {
  const [x, y, z] = toSphere(lat, lon);
  const scale = 0.8 + elevation;
  const px = x * scale;
  const py = y * scale;
  const pz = z * scale;

  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(THETA);
  const sinTheta = Math.sin(THETA);

  const sx = cosPhi * px + sinPhi * pz;
  const sy = sinPhi * sinTheta * px + cosTheta * py - cosPhi * sinTheta * pz;
  const depth = -sinPhi * cosTheta * px + sinTheta * py + cosPhi * cosTheta * pz;

  return { x: (sx + 1) / 2, y: (-sy + 1) / 2, depth };
}

// Where the orbit's ground track sits at sweep angle sigma (radians) — a
// sinusoidal lat swing against a steadily advancing lon, like a real
// satellite ground track.
function orbitLatLon(sigma) {
  return { lat: ORBIT_TILT * Math.sin(sigma), lon: (sigma * 180) / Math.PI };
}

// A clean rotating Earth (cobe) with a plane on a real inclined 3D orbit —
// projected with the same camera math as the globe, so it swings in front
// of and behind the sphere instead of floating on a flat ellipse.
// `progress` is a framer-motion MotionValue in [0, 1] — the caller (a
// scroll-linked section) drives everything from it.
export default function Globe({ progress }) {
  const canvasRef = useRef(null);
  const planeRef = useRef(null);
  const phiRef = useRef(0);
  const visibleRef = useRef(true);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0 }
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let width = canvasRef.current.offsetWidth;
    let idle = 0;
    let raf;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: Math.min(2, window.devicePixelRatio),
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: THETA,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 12000,
      mapBrightness: 6,
      baseColor: [1, 1, 1],
      markerColor: [1, 1, 1],
      glowColor: [0.17, 0.43, 0.46],
      context: { preserveDrawingBuffer: true }
    });

    // cobe v2 has no internal render loop — we own the animation frame,
    // push new state via globe.update(), and place the plane by hand each
    // tick (imperative DOM writes so 60fps doesn't fight React's render).
    const frame = () => {
      if (!visibleRef.current) {
        raf = requestAnimationFrame(frame);
        return;
      }
      if (!prefersReduced) idle += 0.0018;
      const measuredWidth = canvasRef.current ? canvasRef.current.offsetWidth : width;
      if (measuredWidth && measuredWidth !== width) width = measuredWidth;
      const phi = phiRef.current + idle;
      globe.update({ phi, width: width * 2, height: width * 2 });

      const sigma = phi * ORBIT_SPEED;
      const here = orbitLatLon(sigma);
      const point = project(here.lat, here.lon, phi, ORBIT_ELEVATION);

      // Sample just behind and ahead on the path to get both a heading
      // vector and how sharply that heading is turning (for bank angle) —
      // real flight-tracker banking is driven by turn rate, not a canned
      // wobble, so this reads as an actual turn rather than a shimmy.
      const step = 0.012;
      const prev = orbitLatLon(sigma - step);
      const next = orbitLatLon(sigma + step);
      const pointPrev = project(prev.lat, prev.lon, phi, ORBIT_ELEVATION);
      const pointNext = project(next.lat, next.lon, phi, ORBIT_ELEVATION);

      const plane = planeRef.current;
      if (plane) {
        if (point.depth < -0.08) {
          plane.style.opacity = '0';
        } else {
          const depthT = Math.min(1, Math.max(0, (point.depth + 0.3) / 1.1));
          const scale = 0.55 + 0.55 * depthT;

          const headingPrev = Math.atan2(point.y - pointPrev.y, point.x - pointPrev.x);
          const headingNext = Math.atan2(pointNext.y - point.y, pointNext.x - point.x);
          const heading = (headingNext * 180) / Math.PI;

          let turn = ((headingNext - headingPrev) * 180) / Math.PI;
          while (turn > 180) turn -= 360;
          while (turn < -180) turn += 360;
          const bank = Math.max(-28, Math.min(28, turn * 3.2));

          plane.style.opacity = String(0.35 + 0.65 * depthT);
          plane.style.left = `${point.x * 100}%`;
          plane.style.top = `${point.y * 100}%`;
          // rotate() first so its Y-axis points along the current heading,
          // then rotateY banks around that direction-of-travel axis —
          // the same trick flight trackers use for a "leaning into the turn" look.
          plane.style.transform =
            `translate(-50%, -50%) scale(${scale}) perspective(340px) rotate(${heading + 90}deg) rotateY(${bank}deg)`;
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      globe.destroy();
    };
  }, [prefersReduced]);

  useMotionValueEvent(progress, 'change', (v) => {
    const clamped = Math.min(1, Math.max(0, v));
    phiRef.current = clamped * Math.PI * 4;
  });

  return (
    <div className="globe-stage">
      <canvas ref={canvasRef} className="globe-canvas" />
      <div ref={planeRef} className="globe-plane">
        <PlaneIcon size={28} />
      </div>
    </div>
  );
}
