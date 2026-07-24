import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import agencies from '../data/agencies.json';
import { QUESTIONS, NEUTRAL_VALUES } from '../data/quizQuestions.js';
import { getMatches } from '../data/scoreAgency.js';
import QuizQuestion from './QuizQuestion.jsx';
import MatchResultCard from './MatchResultCard.jsx';

const STORAGE_KEY = 'fielded_quiz_result';
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

function hasAnyAnswer(answers) {
  return Object.values(answers).some((v) => (Array.isArray(v) ? v.length > 0 : v != null && v !== ''));
}

// The `religions` answer isn't scored against agencies (no agency has a
// confirmed field for which religious groups it specializes in reaching —
// see the comment on that question in quizQuestions.js), so instead of a
// match card it becomes a link to the map, pre-filtered to those groups
// using the map's own real per-people-group religion data.
function religionMapLink(answers) {
  const selected = (answers.religions || []).filter((v) => !NEUTRAL_VALUES.has(v));
  if (selected.length === 0) return null;
  return `/map?religion=${encodeURIComponent(selected.join(','))}`;
}

function loadSavedResult() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved.timestamp !== 'number') return null;
    if (Date.now() - saved.timestamp > STALE_AFTER_MS) return null;
    return saved;
  } catch {
    return null;
  }
}

export default function MatchQuiz() {
  const [saved, setSaved] = useState(loadSavedResult);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const results = submitted ? getMatches(answers, agencies) : [];
  const answered = hasAnyAnswer(answers);

  function handleSubmit() {
    if (!answered) {
      setShowHint(true);
      return;
    }
    const matches = getMatches(answers, agencies, agencies.length);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        answers,
        matches,
        timestamp: Date.now()
      }));
    } catch {
      // localStorage unavailable (private browsing, quota) — results still
      // render for this session, they just won't survive a reload.
    }
    setSubmitted(true);
  }

  function handleRetake() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setSaved(null);
    setAnswers({});
    setSubmitted(false);
    setShowHint(false);
  }

  if (saved && !submitted) {
    const savedReligionLink = religionMapLink(saved.answers || {});
    return (
      <div className="matcher">
        <h2>Your matches from last time</h2>
        <p>Saved from your last quiz — retake it any time if your answers have changed.</p>
        {savedReligionLink && (
          <p className="matcher-religion-link">
            <Link to={savedReligionLink}>See where those groups are on the map →</Link>
          </p>
        )}
        <div className="results" aria-live="polite">
          {saved.matches.slice(0, 5).map((r, i) => (
            <MatchResultCard key={r.name} result={r} index={i} />
          ))}
        </div>
        <button type="button" onClick={handleRetake}>Retake quiz</button>
      </div>
    );
  }

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

      <button type="button" onClick={handleSubmit}>
        See my matches
      </button>
      {showHint && !answered && (
        <p className="matcher-hint" role="alert">Answer at least one question first — matches need something to go on.</p>
      )}

      {submitted && (
        <div className="results" aria-live="polite">
          <h3>Closest matches</h3>
          {religionMapLink(answers) && (
            <p className="matcher-religion-link">
              <Link to={religionMapLink(answers)}>See where those groups are on the map →</Link>
            </p>
          )}
          {results.map((r, i) => (
            <MatchResultCard key={r.name} result={r} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
