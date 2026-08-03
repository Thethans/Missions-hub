import React from 'react';
import Footer from '../components/Footer.jsx';
import TypeGuardedOnboarding from '../components/TypeGuardedOnboarding.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

export default function ChurchOnboardingPage() {
  usePageMeta({
    title: 'Church Onboarding',
    description: 'Create your church profile so you can request introductions to missionaries.',
    path: '/for-churches/onboarding',
    noindex: true
  });

  return (
    <>
      <section className="page-hero">
        <h1>Church onboarding</h1>
        <p>Sign in to start your profile — a real form comes next.</p>
      </section>
      <div className="page-body">
        <TypeGuardedOnboarding expectedType="church">
          <p className="onboarding-loading" role="status">
            You're signed in. The full profile form isn't built yet — check back soon.
          </p>
        </TypeGuardedOnboarding>
      </div>
      <Footer />
    </>
  );
}
