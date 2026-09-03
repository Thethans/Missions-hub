import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import useMagnetic from '../hooks/useMagnetic.js';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

// The landing page's only entry point into /quiz besides the hero — quiz
// logic and result persistence (MatchQuiz.jsx, scoreAgency.js) are
// untouched, this is purely a new place to link to that existing route.
export default function QuizCTA() {
  const ctaMagnetic = useMagnetic();
  const prefersReduced = usePrefersReducedMotion();

  return (
    <m.div
      className="quiz-cta"
      data-reveal
      initial={prefersReduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <h2>Which agency is worth a conversation?</h2>
      <p>Answer a few questions about your calling, skills, and preferences to find out.</p>
      <m.span ref={ctaMagnetic.ref} style={ctaMagnetic.style} className="magnetic-wrap">
        <Link to="/quiz" className="cta-button cta-button--go">Take the quiz</Link>
      </m.span>
    </m.div>
  );
}
