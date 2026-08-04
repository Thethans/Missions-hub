import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import MissionaryProfile from '../components/MissionaryProfile.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

export default function MissionaryProfilePage() {
  const { missionaryId } = useParams();

  // The real per-missionary title can't be known until the profile loads
  // client-side — this route isn't in scripts/prerender.js's ROUTES (it's
  // dynamic, not a fixed path), so crawlers/direct hits get this generic
  // fallback rather than a prerendered per-profile title either way.
  usePageMeta({
    title: 'Missionary Profile',
    description: 'View an approved missionary profile and request an introduction.',
    path: `/for-churches/${missionaryId}`,
    noindex: true
  });

  // No page-hero <h1> here — MissionaryProfile renders the real page title
  // (the missionary's display_name) once it loads, and a page should only
  // have one <h1>.
  return (
    <>
      <div className="page-body profile-detail-page-body">
        <Link to="/for-churches" className="profile-back-link">&larr; Back to the directory</Link>
        <MissionaryProfile missionaryId={missionaryId} />
      </div>
      <Footer />
    </>
  );
}
