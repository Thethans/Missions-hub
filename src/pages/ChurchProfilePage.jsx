import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Footer from '../components/Footer.jsx';
import ChurchProfile from '../components/ChurchProfile.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

export default function ChurchProfilePage() {
  const { churchId } = useParams();

  // Same reasoning as MissionaryProfilePage.jsx: the real per-church title
  // can't be known until the profile loads client-side, and this dynamic
  // route isn't in scripts/prerender.js's ROUTES.
  usePageMeta({
    title: 'Church Profile',
    description: 'View an approved church profile.',
    path: `/for-missionaries/${churchId}`,
    noindex: true
  });

  // No page-hero <h1> here — ChurchProfile renders the real page title
  // (the church's church_name) once it loads.
  return (
    <>
      <div className="page-body profile-detail-page-body">
        <Link to="/for-missionaries" className="profile-back-link">&larr; Back to the directory</Link>
        <ChurchProfile churchId={churchId} />
      </div>
      <Footer />
    </>
  );
}
