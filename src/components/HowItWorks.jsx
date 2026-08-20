import React from 'react';
import RevealOnScroll from './RevealOnScroll.jsx';

// RevealOnScroll always wraps its child in a <div>, which can't sit between
// an <ol> and an <li> — so this renders as a div-based list (role="list")
// instead of real <ol>/<li>, keeping it readable to assistive tech without
// invalid markup.
export default function HowItWorks({ steps }) {
  return (
    <section className="how-it-works">
      <h2>How it works</h2>
      <div className="how-it-works-list" role="list">
        {steps.map((step, i) => (
          <RevealOnScroll key={step.title} index={i} className="how-it-works-step">
            <div role="listitem">
              <span className="how-it-works-number" aria-hidden="true">{i + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
