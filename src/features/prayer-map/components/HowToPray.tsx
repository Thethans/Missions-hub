import RevealOnScroll from '../../../components/RevealOnScroll.jsx';

// spec_1.md's "where this extends" section calls for the sticky-panel
// pattern from the homepage's JourneySection here, framed around this
// page's actual region-by-region prayer walk. This page isn't structured
// as sequential regions (it's a map + missionary cards, not an editorial
// scroll), so rather than forcing that shape onto working functionality,
// this is a small, additive 3-step explainer of the flow that already
// exists (browse -> open a pin -> pray/give) — same reveal-on-scroll
// treatment as the homepage sections, without touching the map/card logic
// below it.
const STEPS = [
  {
    title: 'Find a missionary',
    body: 'Every pin on the map is a real missionary profile — ministry, location, and support need.'
  },
  {
    title: 'Read their story',
    body: 'Tap a pin to open their card: what they do, their latest updates, and what they’re asking prayer for.'
  },
  {
    title: 'Pray or give',
    body: "Mark that you're praying, or support their monthly need directly if you feel led."
  }
];

export default function HowToPray() {
  return (
    <section className="pm-how-it-works">
      <h2>How this map works</h2>
      <div className="pm-how-it-works-list" role="list">
        {STEPS.map((step, i) => (
          <RevealOnScroll key={step.title} index={i} className="pm-how-it-works-step">
            <div role="listitem">
              <span className="pm-how-it-works-number" aria-hidden="true">{i + 1}</span>
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
