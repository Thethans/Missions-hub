import React from 'react';
import Footer from '../components/Footer.jsx';
import ChurchDirectory from '../components/ChurchDirectory.jsx';
import DirectoryStatKicker from '../components/DirectoryStatKicker.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import DirectoryCTA from '../components/DirectoryCTA.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

const STEPS = [
  {
    title: 'Browse',
    body: 'Approved church profiles, filterable by state and doctrinal position.'
  },
  {
    title: 'Compare',
    body: "See each church's giving capacity, missions focus, and how they engage — short-term trips, sending teams, hosting furloughs."
  },
  {
    title: 'Reach out',
    body: 'Contact them directly using the listed point of contact or website — there’s no in-app introduction request for churches yet.'
  }
];

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
        <DirectoryStatKicker table="church_profiles" label="approved churches" />
      </section>
      <div className="page-body">
        <div className="directory-page-content">
          <ChurchDirectory />
          <HowItWorks steps={STEPS} />
          <DirectoryCTA
            heading="Are you a missionary?"
            body="Create your missionary profile so churches can find and support you."
            linkTo="/missionary-support/onboarding"
            linkLabel="Create your missionary profile"
          />
        </div>
      </div>
      <Footer />
    </>
  );
}
