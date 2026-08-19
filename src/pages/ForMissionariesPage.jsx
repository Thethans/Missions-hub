import React from 'react';
import Footer from '../components/Footer.jsx';
import ChurchDirectory from '../components/ChurchDirectory.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

// Public — no auth required. The missionary-facing mirror of
// ForChurchesPage.jsx (churches browsing missionaries). Distinct from
// /missionary-support, which is where a missionary signs in to manage
// their own profile — this page is just the public directory in the
// other direction, same as /for-churches is for missionaries.
export default function ForMissionariesPage() {
  usePageMeta({
    title: 'For Missionaries',
    description: 'Browse church profiles ready to support a missionary.',
    path: '/for-missionaries'
  });

  return (
    <>
      <section className="page-hero">
        <h1>For missionaries</h1>
        <p>Browse churches whose profiles have been reviewed and approved.</p>
      </section>
      <div className="page-body">
        <ChurchDirectory />
      </div>
      <Footer />
    </>
  );
}
