import React from 'react';
import agencies from '../data/agencies.json';

// Not a "trusted by our partners" strip — Fielded isn't affiliated with,
// paid by, or endorsed by any agency it lists (see AboutPage.jsx's "What
// this is not" section), so framing this as partnership would misrepresent
// the actual relationship. It's a factual scroll of the real agency names
// scoreAgency.js compares — nothing here is invented, just displayed twice
// (duplicated list) so the CSS animation can loop seamlessly.
const NAMES = agencies.map((a) => a.name);
const LOOP = [...NAMES, ...NAMES];

export default function AgencyMarquee() {
  return (
    <section className="agency-marquee">
      <p className="agency-marquee-kicker">{agencies.length} agencies compared in the matcher</p>
      <div className="agency-marquee-track" aria-hidden="true">
        <div className="agency-marquee-list">
          {LOOP.map((name, i) => (
            <span className="agency-marquee-item" key={`${name}-${i}`}>{name}</span>
          ))}
        </div>
      </div>
      {/* The scrolling copy above is aria-hidden (duplicated text reads
          strangely to a screen reader); this gives the same information
          once, properly. */}
      <p className="visually-hidden">Agencies compared: {NAMES.join(', ')}.</p>
    </section>
  );
}
