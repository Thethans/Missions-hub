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

describe('MatchQuiz religion map link', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('links to the map, pre-filtered, when religions were selected', async () => {
    const user = userEvent.setup();
    renderQuiz();

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
    await user.click(screen.getByRole('button', { name: /see my matches/i }));

    expect(screen.queryByRole('link', { name: /see where those groups are on the map/i })).not.toBeInTheDocument();
  });

  it('excludes "no strong preference" from the map link and drops the link entirely if that\'s all that was picked', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByLabelText(/no strong preference/i, { selector: 'input[name="religions"]' }));
    await user.click(screen.getByRole('button', { name: /see my matches/i }));

    expect(screen.queryByRole('link', { name: /see where those groups are on the map/i })).not.toBeInTheDocument();
  });

  it('never affects which agencies are shown as matches', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByLabelText(/church planting/i, { selector: 'input[name="focus"]' }));
    await user.click(screen.getByLabelText(/^islam$/i, { selector: 'input[name="religions"]' }));
    await user.click(screen.getByRole('button', { name: /see my matches/i }));

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    expect(saved.matches.every((m) => !m.matched.some((x) => x.dimension === 'religions'))).toBe(true);
    expect(saved.matches.every((m) => !m.concerns.some((x) => x.dimension === 'religions'))).toBe(true);
  });

  it('surfaces the map link on a restored saved result too', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      answers: { religions: ['Hinduism'] },
      matches: [{ name: 'Pioneers', tradition: 'broadly evangelical', focus: [], supportRaising: null, url: 'https://pioneers.org', score: 0, matched: [], concerns: [] }],
      timestamp: Date.now()
    }));

    renderQuiz();

    const link = screen.getByRole('link', { name: /see where those groups are on the map/i });
    expect(link).toHaveAttribute('href', '/map?religion=Hinduism');
  });
});
