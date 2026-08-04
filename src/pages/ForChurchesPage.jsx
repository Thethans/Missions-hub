import React from 'react';
import Footer from '../components/Footer.jsx';
import MissionaryDirectory from '../components/MissionaryDirectory.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

// Public — no auth required. Distinct from /for-churches/onboarding, which
// is where a church creates its own profile.
export default function ForChurchesPage() {
  usePageMeta({
    title: 'For Churches',
    description: 'Browse approved missionary profiles looking for church support.',
    path: '/for-churches'
  });

  return (
    <>
      <section className="page-hero">
        <h1>For churches</h1>
        <p>Browse missionaries whose profiles have been reviewed and approved.</p>
      </section>
      <div className="page-body">
        <MissionaryDirectory />
      </div>
      <Footer />
    </>
  );
}
