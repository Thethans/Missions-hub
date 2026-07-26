import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MatchQuiz from './MatchQuiz.jsx';
import { QUESTIONS } from '../data/quizQuestions.js';

const STORAGE_KEY = 'fielded_quiz_result';

function renderQuiz() {
  return render(
    <MemoryRouter>
      <MatchQuiz />
    </MemoryRouter>
  );
}

// The quiz is a one-question-per-step wizard — jumps directly to a given
// step via its numbered dot (role="tab") rather than clicking "Next"
// N times, since every question is independently optional and a real user
// can jump around the same way.
async function jumpToStep(user, stepNumber) {
  await user.click(screen.getByRole('tab', { name: new RegExp(`^Question ${stepNumber}\\b`) }));
}

async function submitQuiz(user) {
  await jumpToStep(user, QUESTIONS.length);
  await user.click(screen.getByRole('button', { name: /see my matches/i }));
}

describe('MatchQuiz result persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves answers, matches, and a timestamp to localStorage on submit', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByLabelText(/church planting/i, { selector: 'input[name="focus"]' }));
    await submitQuiz(user);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.answers.focus).toContain('church planting');
    expect(Array.isArray(saved.matches)).toBe(true);
    expect(saved.matches.length).toBeGreaterThan(0);
    expect(typeof saved.timestamp).toBe('number');
  });

  it('shows saved matches from a previous session on mount', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      answers: { tradition: 'broadly evangelical' },
      matches: [{ name: 'Pioneers', tradition: 'broadly evangelical', focus: ['church planting'], supportRaising: null, matchPercent: 100, matched: [], concerns: [] }],
      timestamp: Date.now()
    }));

    renderQuiz();

    expect(screen.getByText(/your matches from last time/i)).toBeInTheDocument();
    expect(screen.getByText('Pioneers')).toBeInTheDocument();
  });

  it('ignores a saved result older than 24 hours and shows a fresh quiz', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      answers: { tradition: 'broadly evangelical' },
      matches: [{ name: 'Pioneers', tradition: 'broadly evangelical', focus: [], supportRaising: null, matchPercent: 100, matched: [], concerns: [] }],
      timestamp: Date.now() - 25 * 60 * 60 * 1000
    }));

    renderQuiz();

    expect(screen.queryByText(/your matches from last time/i)).not.toBeInTheDocument();
    expect(screen.getByText(/agency match quiz/i)).toBeInTheDocument();
  });

  it('clears the saved result and restarts on retake', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      answers: { tradition: 'broadly evangelical' },
      matches: [{ name: 'Pioneers', tradition: 'broadly evangelical', focus: [], supportRaising: null, matchPercent: 100, matched: [], concerns: [] }],
      timestamp: Date.now()
    }));

    renderQuiz();
    await user.click(screen.getByRole('button', { name: /retake quiz/i }));

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByText(/agency match quiz/i)).toBeInTheDocument();
  });
});

describe('MatchQuiz step navigation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts on question 1 of N, with Back disabled', async () => {
    renderQuiz();
    expect(screen.getByText(`Question 1 of ${QUESTIONS.length}`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back/i })).toBeDisabled();
  });

  it('Next advances one question and updates the progress label', async () => {
    const user = userEvent.setup();
    renderQuiz();
    await user.click(screen.getByRole('button', { name: /^next/i }));
    expect(screen.getByText(`Question 2 of ${QUESTIONS.length}`)).toBeInTheDocument();
  });

  it('Back returns to the previous question', async () => {
    const user = userEvent.setup();
    renderQuiz();
    await user.click(screen.getByRole('button', { name: /^next/i }));
    await user.click(screen.getByRole('button', { name: /^back/i }));
    expect(screen.getByText(`Question 1 of ${QUESTIONS.length}`)).toBeInTheDocument();
  });

  it('only shows "See my matches" on the final question', async () => {
    const user = userEvent.setup();
    renderQuiz();
    expect(screen.queryByRole('button', { name: /see my matches/i })).not.toBeInTheDocument();

    await jumpToStep(user, QUESTIONS.length);
    expect(screen.getByRole('button', { name: /see my matches/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^next/i })).not.toBeInTheDocument();
  });

  it('marks a step dot as answered once that question has a value, and preserves the answer when navigating away and back', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByLabelText(/church planting/i, { selector: 'input[name="focus"]' }));
    expect(screen.getByRole('tab', { name: /^Question 1 \(answered\)/ })).toBeInTheDocument();

    await jumpToStep(user, 3);
    await jumpToStep(user, 1);
    expect(screen.getByLabelText(/church planting/i, { selector: 'input[name="focus"]' })).toBeChecked();
  });

  it('shows the hint instead of submitting when nothing has been answered anywhere', async () => {
    const user = userEvent.setup();
    renderQuiz();
    await jumpToStep(user, QUESTIONS.length);
    await user.click(screen.getByRole('button', { name: /see my matches/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(/answer at least one question/i);
    expect(screen.queryByText(/your closest matches/i)).not.toBeInTheDocument();
  });
});

describe('MatchQuiz religion map link', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('links to the map, pre-filtered, when religions were selected', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await jumpToStep(user, QUESTIONS.length); // 'religions' is the last question
    await user.click(screen.getByLabelText(/^islam$/i, { selector: 'input[name="religions"]' }));
    await user.click(screen.getByLabelText(/^buddhism$/i, { selector: 'input[name="religions"]' }));
    await user.click(screen.getByRole('button', { name: /see my matches/i }));

    const link = screen.getByRole('link', { name: /see where those groups are on the map/i });
    expect(link).toHaveAttribute('href', '/map?religion=Islam%2CBuddhism');
  });

  it('shows no map link when no religions were selected', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByLabelText(/church planting/i, { selector: 'input[name="focus"]' }));
    await submitQuiz(user);

    expect(screen.queryByRole('link', { name: /see where those groups are on the map/i })).not.toBeInTheDocument();
  });

  it('excludes "no strong preference" from the map link and drops the link entirely if that\'s all that was picked', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await jumpToStep(user, QUESTIONS.length);
    await user.click(screen.getByLabelText(/no strong preference/i, { selector: 'input[name="religions"]' }));
    await user.click(screen.getByRole('button', { name: /see my matches/i }));

    expect(screen.queryByRole('link', { name: /see where those groups are on the map/i })).not.toBeInTheDocument();
  });

  it('never affects which agencies are shown as matches', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByLabelText(/church planting/i, { selector: 'input[name="focus"]' }));
    await jumpToStep(user, QUESTIONS.length);
    await user.click(screen.getByLabelText(/^islam$/i, { selector: 'input[name="religions"]' }));
    await user.click(screen.getByRole('button', { name: /see my matches/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.matches.every((m) => !m.matched.some((x) => x.dimension === 'religions'))).toBe(true);
    expect(saved.matches.every((m) => !m.concerns.some((x) => x.dimension === 'religions'))).toBe(true);
  });

  it('surfaces the map link on a restored saved result too', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      answers: { religions: ['Hinduism'] },
      matches: [{ name: 'Pioneers', tradition: 'broadly evangelical', focus: [], supportRaising: null, matchPercent: null, matched: [], concerns: [] }],
      timestamp: Date.now()
    }));

    renderQuiz();

    const link = screen.getByRole('link', { name: /see where those groups are on the map/i });
    expect(link).toHaveAttribute('href', '/map?religion=Hinduism');
  });
});
