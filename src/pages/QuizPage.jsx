import React from 'react';
import MatchQuiz from '../components/MatchQuiz.jsx';
import Footer from '../components/Footer.jsx';
import usePageMeta from '../hooks/usePageMeta.js';

export default function QuizPage() {
  usePageMeta({
    title: 'Agency Match',
    description: 'Answer a few questions to find mission agencies that match your calling, skills, and preferences.',
    path: '/quiz'
  });

  return (
    <>
      <section className="page-hero">
        <h1>Find your sending agency</h1>
        <p>A few questions to point you toward agencies worth a real conversation.</p>
      </section>
      <div className="page-body">
        <MatchQuiz />
      </div>
      <Footer />
    </>
  );
}
