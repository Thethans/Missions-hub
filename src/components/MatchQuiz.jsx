import React, { useState } from 'react';
import agencies from '../data/agencies.json';
import { QUESTIONS } from '../data/quizQuestions.js';
import { getMatches } from '../data/scoreAgency.js';
import QuizQuestion from './QuizQuestion.jsx';
import MatchResultCard from './MatchResultCard.jsx';

function hasAnyAnswer(answers) {
  return Object.values(answers).some((v) => (Array.isArray(v) ? v.length > 0 : v != null && v !== ''));
}

export default function MatchQuiz() {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const results = submitted ? getMatches(answers, agencies) : [];
  const answered = hasAnyAnswer(answers);

  return (
    <div className="matcher">
      <h2>Find your mission board</h2>
      <p>This is a starting point, not a final answer — always talk to a real person at each agency.</p>

      {QUESTIONS.map((q) => (
        <QuizQuestion
          key={q.key}
          question={q}
          value={answers[q.key]}
          onChange={(opt) => setAnswers({ ...answers, [q.key]: opt })}
        />
      ))}

      <button
        type="button"
        onClick={() => {
          if (!answered) {
            setShowHint(true);
            return;
          }
          setSubmitted(true);
        }}
      >
        See my matches
      </button>
      {showHint && !answered && (
        <p className="matcher-hint" role="alert">Answer at least one question first — matches need something to go on.</p>
      )}

      {submitted && (
        <div className="results" aria-live="polite">
          <h3>Closest matches</h3>
          {results.map((r, i) => (
            <MatchResultCard key={r.name} result={r} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
