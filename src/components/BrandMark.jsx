import React from 'react';

// A map-pin containing a small globe — reads instantly as "a place on the
// map / the field," which is what Fielded is about. Filled in brand teal
// with a paper-colored globe so it stays legible on the dark navy nav.
// Hex values are inlined rather than var(--token) because CSS custom
// properties don't resolve inside SVG presentation attributes.
export default function BrandMark({ size = 30 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* Pin body (teardrop) */}
      <path
        d="M50 5 C30 5 14 21 14 41 C14 60 38 82 47.5 92.6 A3.3 3.3 0 0 0 52.5 92.6 C62 82 86 60 86 41 C86 21 70 5 50 5 Z"
        fill="#2b6e76"
      />
      {/* Globe disc sitting in the pin's head */}
      <circle cx="50" cy="40" r="19" fill="#faf7f0" />
      {/* Meridians + equator drawn back in teal */}
      <g stroke="#2b6e76" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <ellipse cx="50" cy="40" rx="7.5" ry="19" />
        <line x1="31" y1="40" x2="69" y2="40" />
        <path d="M34.5 29 Q50 34.5 65.5 29" />
        <path d="M34.5 51 Q50 45.5 65.5 51" />
      </g>
    </svg>
  );
}
