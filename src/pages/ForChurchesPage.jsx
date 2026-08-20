import React from 'react';
import Footer from '../components/Footer.jsx';
import MissionaryDirectory from '../components/MissionaryDirectory.jsx';
import DirectoryStatKicker from '../components/DirectoryStatKicker.jsx';
import HowItWorks from '../components/HowItWorks.jsx';
import DirectoryCTA from '../components/DirectoryCTA.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

const STEPS = [
  {
    title: 'Browse',
    body: 'Approved missionary profiles, filterable by field region and doctrinal position.'
  },
  {
    title: 'Get approved',
    body: "Create a church profile — it's reviewed before you can request an introduction."
  },
  {
    title: 'Reach out',
    body: "Request an introduction directly from a missionary's profile. They decide whether to respond."
  }
];

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
        <DirectoryStatKicker table="missionary_profiles" label="approved missionaries" />
      </section>
      <div className="page-body">
        <MissionaryDirectory />
        <HowItWorks steps={STEPS} />
        <DirectoryCTA
          heading="Are you a church?"
          body="Create your church profile so you can request introductions to missionaries."
          linkTo="/for-churches/onboarding"
          linkLabel="Create your church profile"
        />
      </div>
      <Footer />
    </>
  );
}
