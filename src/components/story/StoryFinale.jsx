import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { SCRIPTURE_ATTRIBUTION } from '../../data/scripture.js';
import useMagnetic from '../../hooks/useMagnetic.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';

const EASE = [0.16, 1, 0.3, 1];

export default function StoryFinale() {
  const prefersReduced = usePrefersReducedMotion();
  const quizMagnetic = useMagnetic();

  return (
    <section className="story-finale">
      <m.div
        className="story-finale-ctas"
        initial={prefersReduced ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.7, ease: EASE }}
      >
        <m.span ref={quizMagnetic.ref} style={quizMagnetic.style} className="magnetic-wrap">
          <Link to="/quiz" className="cta-button cta-button--go">Take the quiz</Link>
        </m.span>
        <Link to="/map" className="story-finale-link">See the map</Link>
        <a
          href="mailto:emailfieldedhub@gmail.com?subject=Bringing%20Fielded%20to%20our%20church"
          className="story-finale-link"
        >
          Bring this to your church
        </a>
      </m.div>
      <m.p
        className="story-finale-line"
        initial={prefersReduced ? false : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
      >
        Get to the field.
      </m.p>
      <p className="story-finale-attribution">{SCRIPTURE_ATTRIBUTION}</p>
    </section>
  );
}
