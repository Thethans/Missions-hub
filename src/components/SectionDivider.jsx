import React, { useId } from 'react';

// A soft-curved, gradient-filled seam between two differently-toned
// sections — used where the color boundary is currently a hard rectangular
// snap (Journey→Capabilities, Capabilities→MapTeaser, MapTeaser→Faq). The
// Hero/StatsStrip→Journey handoff already has its own dissolve
// (.stats-strip::after) — this reuses that same "no hard seam" idea for the
// rest of the page, with an added wave silhouette so it reads as a
// deliberate transition rather than a flat gradient bar. A gentle single
// curve (not a jagged/angled cut) — decorative, so aria-hidden.
export default function SectionDivider({ from, to }) {
  const uid = useId();
  const gradientId = `section-divider-${uid}`;

  return (
    <svg
      className="section-divider"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: from }} />
          <stop offset="100%" style={{ stopColor: to }} />
        </linearGradient>
      </defs>
      <path d="M0,46 C 380,10 1060,86 1440,34 L1440,120 L0,120 Z" fill={`url(#${gradientId})`} />
    </svg>
  );
}
