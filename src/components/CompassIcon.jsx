import React from 'react';

export default function CompassIcon({ size = 30 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {/* Outer circle */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="#5b6472" strokeWidth="2" />

      {/* Cardinal direction markers */}
      <line x1="50" y1="8" x2="50" y2="14" stroke="#5b6472" strokeWidth="2" />
      <line x1="50" y1="86" x2="50" y2="92" stroke="#5b6472" strokeWidth="1.5" opacity="0.6" />
      <line x1="92" y1="50" x2="86" y2="50" stroke="#5b6472" strokeWidth="1.5" opacity="0.6" />
      <line x1="14" y1="50" x2="8" y2="50" stroke="#5b6472" strokeWidth="1.5" opacity="0.6" />

      {/* Compass needle - pointing north */}
      <path d="M50 50 L35 75 L50 68 L65 75 Z" fill="#2b6e76" />
      <path d="M50 50 L47 22 L50 30 L53 22 Z" fill="#c7c2b6" />

      {/* Center circle */}
      <circle cx="50" cy="50" r="4" fill="#1c4b52" />
    </svg>
  );
}
