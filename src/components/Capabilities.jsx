import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Compass, CheckSquare } from '@phosphor-icons/react';
import agencies from '../data/agencies.json';
import { QUESTIONS } from '../data/quizQuestions.js';

// Counts come from the same files the quiz itself reads (src/data/
// agencies.json, src/data/quizQuestions.js) rather than being hand-typed —
// the audit flagged this exact line as a stale claim ("opportunity count
// went 55 → 1,440 without the copy noticing"): it said "14" when
// agencies.json already had 28 real entries.
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
    icon: CheckSquare,
    title: 'A checklist that adapts to you',
    desc: 'Sign in and get a pre-field checklist filtered by your role and destination access-level, with progress saved to your account.'
  }
];

const EASE = [0.16, 1, 0.3, 1];

export default function Capabilities() {
  return (
    <section className="capabilities">
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
          <motion.div
            key={item.title}
            className="capability-wrapper"
            initial={{ opacity: 0, y: 50, scale: 0.92 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: EASE }}
          >
            <div className="capability-card">
              <div className="capability-icon">
                <item.icon size={28} weight="duotone" />
              </div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
