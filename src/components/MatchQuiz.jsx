import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { track } from '@vercel/analytics';
import { CaretLeft, CaretRight, CheckCircle } from '@phosphor-icons/react';
import agencies from '../data/agencies.json';
import { QUESTIONS, NEUTRAL_VALUES } from '../data/quizQuestions.js';
import { getMatches } from '../data/scoreAgency.js';
import QuizQuestion from './QuizQuestion.jsx';
import MatchResultCard from './MatchResultCard.jsx';

const STORAGE_KEY = 'fielded_quiz_result';
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
const TOTAL_STEPS = QUESTIONS.length;

function hasAnyAnswer(answers) {
  return Object.values(answers).some((v) => (Array.isArray(v) ? v.length > 0 : v != null && v !== ''));
}

function isAnswered(question, answers) {
  const v = answers[question.key];
  return Array.isArray(v) ? v.length > 0 : v != null && v !== '';
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
  const [step, setStep] = useState(0);

  const results = submitted ? getMatches(answers, agencies) : [];
  const answered = hasAnyAnswer(answers);
  const currentQuestion = QUESTIONS[step];
  const isLastStep = step === TOTAL_STEPS - 1;

  // Advancing via Back/Next/a step-dot changes which question is on screen,
  // but nothing else about the page does — no navigation, no route change,
  // nothing RootLayout's own route announcer would catch. Without this, a
  // screen-reader user has no signal the question changed at all unless
  // they happen to re-explore the page after clicking. Skipped on first
  // mount (ref starts true) so there's no spurious announcement before
  // anyone's touched anything — same "effect only fires on subsequent
  // changes" convention RootLayout's own route announcement already uses.
  const [stepAnnouncement, setStepAnnouncement] = useState('');
  const isFirstStepRender = React.useRef(true);
  useEffect(() => {
    if (isFirstStepRender.current) {
      isFirstStepRender.current = false;
      return;
    }
    setStepAnnouncement(`Question ${step + 1} of ${TOTAL_STEPS}: ${currentQuestion.text}`);
  }, [step, currentQuestion]);

  function goToStep(index) {
    setStep(Math.max(0, Math.min(TOTAL_STEPS - 1, index)));
    setShowHint(false);
  }

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
      track('quiz_completed', { matchCount: matches.length });
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
    setStep(0);
  }

  if (saved && !submitted) {
    const savedReligionLink = religionMapLink(saved.answers || {});
    return (
      <div className="matcher">
        <h2>Your matches from last time</h2>
        <p>Saved from your last quiz. Retake it any time if your answers have changed.</p>
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

  if (submitted) {
    return (
      <div className="matcher">
        <div className="results" aria-live="polite">
          <h3>Your closest matches</h3>
          {religionMapLink(answers) && (
            <p className="matcher-religion-link">
              <Link to={religionMapLink(answers)}>See where those groups are on the map →</Link>
            </p>
          )}
          {results.map((r, i) => (
            <MatchResultCard key={r.name} result={r} index={i} />
          ))}
        </div>
        <button type="button" onClick={handleRetake}>Retake quiz</button>
      </div>
    );
  }

  return (
    <div className="matcher">
      <p className="matcher-kicker">Agency match quiz</p>
      <p className="matcher-intro">
        This is a starting point, not a final answer. Always talk with a real person at the agency before deciding.
      </p>

      <div className="matcher-progress" role="group" aria-label="Quiz progress">
        <div className="matcher-progress-bar">
          <div
            className="matcher-progress-fill"
            style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <span className="matcher-progress-label">Question {step + 1} of {TOTAL_STEPS}</span>
      </div>

      {/* Plain buttons with aria-current="step", not role="tablist"/"tab":
          these are stops in a linear wizard, not independent panels of
          content — real tabs imply arrow-key navigation and a matching
          role="tabpanel", neither of which existed here, so a screen
          reader announced "tab 1 of 8" and then arrow keys did nothing.
          aria-current="step" is the pattern WAI-ARIA actually recommends
          for a multi-step process indicator like this one. */}
      <div className="matcher-steps" role="group" aria-label="Jump to a question">
        {QUESTIONS.map((q, i) => (
          <button
            key={q.key}
            type="button"
            aria-current={i === step ? 'step' : undefined}
            aria-label={`Question ${i + 1}${isAnswered(q, answers) ? ' (answered)' : ''}`}
            className={`matcher-step-dot${i === step ? ' matcher-step-dot--current' : ''}${isAnswered(q, answers) ? ' matcher-step-dot--answered' : ''}`}
            onClick={() => goToStep(i)}
          >
            {isAnswered(q, answers) ? <CheckCircle weight="fill" size={14} /> : i + 1}
          </button>
        ))}
      </div>

      <p className="visually-hidden" role="status" aria-live="polite">{stepAnnouncement}</p>

      <QuizQuestion
        key={currentQuestion.key}
        question={currentQuestion}
        value={answers[currentQuestion.key]}
        onChange={(opt) => setAnswers({ ...answers, [currentQuestion.key]: opt })}
      />

      <div className="matcher-nav">
        <button
          type="button"
          className="matcher-nav-back"
          onClick={() => goToStep(step - 1)}
          disabled={step === 0}
        >
          <CaretLeft size={16} weight="bold" /> Back
        </button>
        {isLastStep ? (
          <button type="button" className="matcher-nav-submit" onClick={handleSubmit}>
            See my matches
          </button>
        ) : (
          <button type="button" className="matcher-nav-next" onClick={() => goToStep(step + 1)}>
            Next <CaretRight size={16} weight="bold" />
          </button>
        )}
      </div>
      {showHint && !answered && (
        <p className="matcher-hint" role="alert">Answer at least one question first — matches need something to go on.</p>
      )}
    </div>
  );
}
