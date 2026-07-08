import React from 'react';
import Footer from '../components/Footer.jsx';
import RevealOnScroll from '../components/RevealOnScroll.jsx';

const SECTIONS = [
  {
    title: 'Why this exists',
    body: (
      <>
        <p>
          Fielded exists to make it easier to go from "I think I'm called to missions" to
          standing in front of the right people group with the right agency. Mission-agency
          information is scattered across dozens of individual sites, each written to make
          its own agency look like the obvious fit — there's no neutral place to compare them
          side by side.
        </p>
        <p>
          The map shows where the need is, the quiz points you toward agencies worth a
          conversation, and the checklist keeps you honest about what's left before you leave.
        </p>
      </>
    )
  },
  {
    title: 'What the data is',
    body: (
      <p>
        The people-group data on the map comes from{' '}
        <a href="https://joshuaproject.net" target="_blank" rel="noreferrer">Joshua Project</a>,
        refreshed on a weekly schedule. Each people group is tagged <strong>unreached</strong>{' '}
        (little to no access to the gospel in their own culture and language), <strong>formative</strong>{' '}
        (early-stage access, not yet an established indigenous church movement), or{' '}
        <strong>reached</strong> (an established, self-sustaining church presence already exists).
      </p>
    )
  },
  {
    title: 'How matching works',
    body: (
      <p>
        The quiz scores each agency against public information gathered directly from that
        agency's own site — their stated theological tradition, ministry focus, support-raising
        model, regions, term lengths, and roles recruited. Where an agency's public materials
        don't clearly state something, the quiz says so explicitly as an open question rather
        than guessing — you'll see it listed under "worth asking about," never asserted as a
        fact the agency never published.
      </p>
    )
  },
  {
    title: 'What this is not',
    body: (
      <p>
        Fielded is not affiliated with, and does not receive any benefit from, any sending
        agency it lists. It doesn't place missionaries, guarantee a fit, or replace a real
        conversation with an agency's own recruiting team — it's a starting point for that
        conversation, not the end of it.
      </p>
    )
  }
];

export default function AboutPage() {
  return (
    <>
      <div className="page-about">
        <h1>About Fielded</h1>
        {SECTIONS.map((section, i) => (
          <RevealOnScroll key={section.title} index={i} className="about-section">
            <h2>{section.title}</h2>
            {section.body}
          </RevealOnScroll>
        ))}
      </div>
      <Footer />
    </>
  );
}
