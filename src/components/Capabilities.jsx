import React from 'react';
import RevealOnScroll from './RevealOnScroll.jsx';

const ITEMS = [
  {
    title: 'A live map, not a static graphic',
    desc: 'The world map pulls real, current people-group data from Joshua Project — not a one-time snapshot.'
  },
  {
    title: 'A matcher that shows its work',
    desc: '7 questions, 14 researched sending agencies, and a results view that explains exactly what matched and what to ask about — not just a ranked list.'
  },
  {
    title: 'A checklist that adapts to you',
    desc: 'Sign in and get a pre-field checklist filtered by your role and destination access-level, with progress saved to your account.'
  }
];

export default function Capabilities() {
  return (
    <section className="capabilities">
      <h2>What's actually in here</h2>
      <div className="capabilities-grid">
        {ITEMS.map((item, i) => (
          <RevealOnScroll key={item.title} index={i} className="capability-wrapper">
            <div className="capability-card">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
