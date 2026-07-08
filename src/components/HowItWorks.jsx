import React, { useRef } from 'react';
import RevealOnScroll from './RevealOnScroll.jsx';
import RouteLine from './RouteLine.jsx';

const STEPS = [
  { n: '01', title: 'Take the quiz', desc: 'Answer a few questions about your calling, tradition, and support-raising comfort.' },
  { n: '02', title: 'Get matched', desc: 'See mission boards whose focus and culture actually fit you.' },
  { n: '03', title: 'Get to the field', desc: 'Use the checklist to track everything before you deploy.' }
];

export default function HowItWorks() {
  const stepsRef = useRef(null);

  return (
    <section className="how-it-works">
      <h2>How it works</h2>
      <div className="how-it-works-steps" ref={stepsRef}>
        <RouteLine
          variant="scroll"
          containerRef={stepsRef}
          pathD="M20,20 L280,20"
          viewBox="0 0 300 40"
          className="how-it-works-connector"
        />
        {STEPS.map((step, i) => (
          <RevealOnScroll key={step.n} index={i} className="how-it-works-step-wrapper">
            <div className="how-it-works-step">
              <span className="how-it-works-number">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
