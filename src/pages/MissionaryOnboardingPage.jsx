import React from 'react';
import Footer from '../components/Footer.jsx';
import TypeGuardedOnboarding from '../components/TypeGuardedOnboarding.jsx';
import MissionaryOnboardingForm from '../components/MissionaryOnboardingForm.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

export default function MissionaryOnboardingPage() {
  usePageMeta({
    title: 'Missionary Onboarding',
    description: 'Create your missionary profile so churches can find and support you.',
    path: '/missionary-support/onboarding',
    noindex: true
  });

  return (
    <>
      <section className="page-hero">
        <h1>Missionary onboarding</h1>
        <p>Sign in, then tell us about your field and support needs.</p>
      </section>
      <div className="page-body">
        <TypeGuardedOnboarding expectedType="missionary">
          <MissionaryOnboardingForm />
        </TypeGuardedOnboarding>
      </div>
      <Footer />
    </>
  );
}
