import React from 'react';
import MatchQuiz from '../components/MatchQuiz.jsx';
import Footer from '../components/Footer.jsx';

export default function QuizPage() {
  return (
    <>
      <section className="page-hero">
        <h1>Quiz → Match</h1>
        <p>A few questions to point you toward agencies worth a real conversation.</p>
      </section>
      <div className="page-body">
        <MatchQuiz />
      </div>
      <Footer />
    </>
  );
}
