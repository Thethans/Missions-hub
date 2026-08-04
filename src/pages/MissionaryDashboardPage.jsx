import React from 'react';
import Footer from '../components/Footer.jsx';
import MissionaryDashboard from '../components/MissionaryDashboard.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

export default function MissionaryDashboardPage() {
  usePageMeta({
    title: 'Missionary Dashboard',
    description: 'Manage your missionary profile and intro requests.',
    path: '/missionary-support',
    noindex: true
  });

  return (
    <>
      <section className="page-hero">
        <h1>Missionary dashboard</h1>
      </section>
      <div className="page-body">
        <MissionaryDashboard />
      </div>
      <Footer />
    </>
  );
}
