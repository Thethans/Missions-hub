import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MatchQuiz from './MatchQuiz.jsx';

const STORAGE_KEY = 'fielded_quiz_result';

function renderQuiz() {
  return render(
    <MemoryRouter>
      <MatchQuiz />
    </MemoryRouter>
  );
}

describe('MatchQuiz result persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves answers, matches, and a timestamp to localStorage on submit', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByLabelText(/church planting/i, { selector: 'input[name="focus"]' }));
    await user.click(screen.getByRole('button', { name: /see my matches/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.answers.focus).toContain('church planting');
    expect(Array.isArray(saved.matches)).toBe(true);
    expect(saved.matches.length).toBeGreaterThan(0);
    expect(typeof saved.timestamp).toBe('number');
  });

  it('moves focus to the results heading after submitting, so a keyboard user is not left behind on the button', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByLabelText(/church planting/i, { selector: 'input[name="focus"]' }));
    await user.click(screen.getByRole('button', { name: /see my matches/i }));

    const resultsHeading = screen.getByRole('heading', { name: /closest matches/i });
    expect(resultsHeading).toHaveFocus();
  });

  it('shows saved matches from a previous session on mount', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      answers: { tradition: 'broadly evangelical' },
      matches: [{ name: 'Pioneers', tradition: 'broadly evangelical', focus: ['church planting'], supportRaising: null, url: 'https://pioneers.org', score: 2, matched: [], concerns: [] }],
      timestamp: Date.now()
    }));

    renderQuiz();

    expect(screen.getByText(/your matches from last time/i)).toBeInTheDocument();
    expect(screen.getByText('Pioneers')).toBeInTheDocument();
  });

  it('ignores a saved result older than 24 hours and shows a fresh quiz', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      answers: { tradition: 'broadly evangelical' },
      matches: [{ name: 'Pioneers', tradition: 'broadly evangelical', focus: [], supportRaising: null, url: 'https://pioneers.org', score: 2, matched: [], concerns: [] }],
      timestamp: Date.now() - 25 * 60 * 60 * 1000
    }));

    renderQuiz();

    expect(screen.queryByText(/your matches from last time/i)).not.toBeInTheDocument();
    expect(screen.getByText(/find your mission board/i)).toBeInTheDocument();
  });

  it('clears the saved result and restarts on retake', async () => {
    const user = userEvent.setup();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      answers: { tradition: 'broadly evangelical' },
      matches: [{ name: 'Pioneers', tradition: 'broadly evangelical', focus: [], supportRaising: null, url: 'https://pioneers.org', score: 2, matched: [], concerns: [] }],
      timestamp: Date.now()
    }));

    renderQuiz();
    await user.click(screen.getByRole('button', { name: /retake quiz/i }));

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(screen.getByText(/find your mission board/i)).toBeInTheDocument();
  });
});
