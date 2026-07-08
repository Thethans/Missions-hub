import React from 'react';
import { Link } from 'react-router-dom';
import StatsStrip from '../components/StatsStrip.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import MapTeaser from '../components/MapTeaser.jsx';
import Footer from '../components/Footer.jsx';

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <h1>Get to the field.</h1>
        <p>Find the people still waiting to hear, the agencies who can send you, and everything in between.</p>
        <Link to="/quiz" className="cta-button">Take the quiz</Link>
      </section>
      <StatsStrip />
      <HowItWorks />
      <MapTeaser />
      <Footer />
    </>
  );
}
