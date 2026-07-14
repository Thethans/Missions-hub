import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import RevealOnScroll from '../components/RevealOnScroll.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

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
    title: 'Support map (prototype)',
    body: (
      <>
        <p>
          The{' '}
          <Link to="/prayer-map">missionary support map</Link>{' '}
          is an early prototype exploring a different side of missions: not finding a field, but
          staying connected to the people already on one. It's a working demo, not a live product —
          every missionary, budget, prayer request, and donation on it is mock data, and nothing it
          shows touches a real payment, login, or mailing list.
        </p>
        <p>
          The idea is a single interactive map a sending church could gather around: pins for each
          missionary they support, opening to that person's ministry overview, latest updates,
          prayer requests, and monthly support budget. A visitor could tap "I'm praying," give a
          one-time or recurring gift, or subscribe to a missionary's newsletter — while verified
          church members sign in to see sensitive requests kept off the public page, protected by a
          session that times out for safety.
        </p>
        <p>
          Made real, the demo's mocks map onto ordinary building blocks: missionary records and
          budgets in an admin-editable database, giving through Stripe or a platform like Planning
          Center Giving, member access through the church's own directory (so confidential requests
          are gated on the server and never sent to a guest's browser), newsletters handed off to an
          email tool, and prayer counts driven by real activity rather than a static number. For now
          it stands as a look at what that could feel like.
        </p>
      </>
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
  usePageMeta({
    title: 'About',
    description: 'Why Fielded exists, how the data works, and what makes this different from other missions directories.',
    path: '/about'
  });

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
