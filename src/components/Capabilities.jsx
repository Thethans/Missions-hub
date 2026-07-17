import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Compass, Briefcase, CheckSquare } from '@phosphor-icons/react';
import agencies from '../data/agencies.json';
import { QUESTIONS } from '../data/quizQuestions.js';
import opportunitiesStats from '../data/opportunitiesStats.json';
import useTilt from '../hooks/useTilt.js';
import SpotlightOverlay from './SpotlightOverlay.jsx';

// Counts come from the same files the quiz itself reads (src/data/
// agencies.json, src/data/quizQuestions.js) rather than being hand-typed —
// the audit flagged this exact line as a stale claim ("opportunity count
// went 55 → 1,440 without the copy noticing"): it said "14" when
// agencies.json already had 28 real entries. The opportunities count comes
// from src/data/opportunitiesStats.json (see
// scripts/generate-opportunities-stats.js), computed from the same
// public/data/opportunities-fallback.json snapshot OpportunitiesExplorer.jsx
// itself is generated against, so the two numbers can't drift apart.
const ITEMS = [
  {
    icon: Globe,
    title: 'A live map, not a static graphic',
    desc: 'The world map pulls real, current people-group data from Joshua Project — not a one-time snapshot.'
  },
  {
    icon: Compass,
    title: 'A matcher that shows its work',
    desc: `${QUESTIONS.length} questions, ${agencies.length} researched sending agencies, and a results view that explains exactly what matched and what to ask about — not just a ranked list.`
  },
  {
    icon: Briefcase,
    title: 'An explorer stocked with real openings',
    desc: `${opportunitiesStats.count.toLocaleString()} live opportunities across ${opportunitiesStats.agencyCount} agencies — filter by role, region, or term length instead of scrolling one long list.`
  },
  {
    icon: CheckSquare,
    title: 'A checklist that adapts to you',
    desc: 'Sign in and get a pre-field checklist filtered by your role and destination access-level, with progress saved to your account.'
  }
];

const EASE = [0.16, 1, 0.3, 1];

// Own component (not inlined in the .map() below) because useTilt needs one
// hook call per card — hooks can't be called inside a loop callback.
function CapabilityCard({ item, index }) {
  const tilt = useTilt();
  return (
    <motion.div
      ref={tilt.ref}
      className="capability-wrapper"
      initial={{ opacity: 0, y: 50, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: EASE }}
      style={tilt.style}
    >
      <div className="capability-card">
        <span className="capability-number">{String(index + 1).padStart(2, '0')}</span>
        <h3>
          <item.icon size={18} weight="bold" />
          {item.title}
        </h3>
        <p>{item.desc}</p>
      </div>
    </motion.div>
  );
}

export default function Capabilities() {
  return (
    <section className="capabilities">
      <SpotlightOverlay />
      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        What&rsquo;s actually in here
      </motion.h2>
      <div className="capabilities-grid">
        {ITEMS.map((item, i) => (
          <CapabilityCard key={item.title} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}
