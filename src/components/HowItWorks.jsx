import React from 'react';

const STEPS = [
  { n: '01', title: 'Take the quiz', desc: 'Answer a few questions about your calling, tradition, and support-raising comfort.' },
  { n: '02', title: 'Get matched', desc: 'See mission boards whose focus and culture actually fit you.' },
  { n: '03', title: 'Get to the field', desc: 'Use the checklist to track everything before you deploy.' }
];

export default function HowItWorks() {
  return (
    <section className="how-it-works">
      <h2>How it works</h2>
      <div className="how-it-works-steps">
        {STEPS.map((step) => (
          <div className="how-it-works-step" key={step.n}>
            <span className="how-it-works-number">{step.n}</span>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
