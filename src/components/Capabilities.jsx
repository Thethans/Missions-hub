import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Compass, CheckSquare } from '@phosphor-icons/react';

const ITEMS = [
  {
    icon: Globe,
    title: 'A live map, not a static graphic',
    desc: 'The world map pulls real, current people-group data from Joshua Project — not a one-time snapshot.'
  },
  {
    icon: Compass,
    title: 'A matcher that shows its work',
    desc: '7 questions, 14 researched sending agencies, and a results view that explains exactly what matched and what to ask about — not just a ranked list.'
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
