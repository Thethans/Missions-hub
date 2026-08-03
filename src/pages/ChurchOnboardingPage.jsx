import React from 'react';
import Footer from '../components/Footer.jsx';
import TypeGuardedOnboarding from '../components/TypeGuardedOnboarding.jsx';
import ChurchOnboardingForm from '../components/ChurchOnboardingForm.jsx';
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
        <p>Sign in, then tell us about your church.</p>
      </section>
      <div className="page-body">
        <TypeGuardedOnboarding expectedType="church">
          <ChurchOnboardingForm />
        </TypeGuardedOnboarding>
      </div>
      <Footer />
    </>
  );
}
