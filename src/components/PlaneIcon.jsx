import React from 'react';

// Top-down commercial-jet silhouette (the convention flight trackers use,
// since it reads correctly at any heading rotation) with gradient shading
// on the fuselage and wings so it has actual dimension instead of a flat
// monochrome glyph.
export default function PlaneIcon({ size = 30 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="plane-fuselage" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8891a0" />
          <stop offset="42%" stopColor="#f8f6f0" />
          <stop offset="58%" stopColor="#f8f6f0" />
          <stop offset="100%" stopColor="#8891a0" />
        </linearGradient>
        <linearGradient id="plane-wing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eeece5" />
          <stop offset="100%" stopColor="#828a97" />
        </linearGradient>
      </defs>

      <path d="M38 84 L13 95 L19.5 97 L44 90 Z" fill="url(#plane-wing)" stroke="#5b6472" strokeWidth="0.5" />
      <path d="M62 84 L87 95 L80.5 97 L56 90 Z" fill="url(#plane-wing)" stroke="#5b6472" strokeWidth="0.5" />

      <path d="M50 40 L5 65 L9.5 72 L48.5 57 Z" fill="url(#plane-wing)" stroke="#5b6472" strokeWidth="0.5" />
      <path d="M50 40 L95 65 L90.5 72 L51.5 57 Z" fill="url(#plane-wing)" stroke="#5b6472" strokeWidth="0.5" />

      <path
        d="M50 3 C57 3 61 15 61 30 L61 82 C61 90 55 96.5 50 98 C45 96.5 39 90 39 82 L39 30 C39 15 43 3 50 3 Z"
        fill="url(#plane-fuselage)"
        stroke="#5b6472"
        strokeWidth="0.6"
      />

      <ellipse cx="50" cy="15" rx="4.2" ry="6" fill="#1c4b52" opacity="0.75" />
      <line x1="50" y1="24" x2="50" y2="78" stroke="#c7c2b6" strokeWidth="0.6" opacity="0.6" />

      <path d="M50 76 L58 92 L50 96.5 Z" fill="#2b6e76" />
    </svg>
  );
}
