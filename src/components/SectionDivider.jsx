import React from 'react';

// A soft-curved seam between two differently-toned sections — used where
// the color boundary is currently a hard rectangular snap
// (Journey→Capabilities, Capabilities→MapTeaser, MapTeaser→Faq). The
// Hero/StatsStrip→Journey handoff already has its own dissolve
// (.stats-strip::after) — this reuses that same "no hard seam" idea for the
// rest of the page. Both halves are solid fills (not a `from`→`to` color
// blend): a top→bottom linear gradient painted across a thin, irregularly
// curved wave produced a muddy, hazy-looking band rather than a clean edge,
// since navy and cream interpolate through a desaturated grey midtone. A
// crisp solid curve reads as smoother despite (in fact because of) having
// no blur. Decorative, so aria-hidden.
export default function SectionDivider({ from, to }) {
  return (
    <svg
      className="section-divider"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <rect width="1440" height="120" fill={from} />
      <path d="M0,46 C 380,10 1060,86 1440,34 L1440,120 L0,120 Z" fill={to} />
    </svg>
  );
}
