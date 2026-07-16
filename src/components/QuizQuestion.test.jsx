import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import QuizQuestion from './QuizQuestion.jsx';
import { QUESTIONS } from '../data/quizQuestions.js';

// The audit flagged quiz question labels rendering twice (bold, then plain)
// — verifying rather than assuming this is already fixed: QuizQuestion.jsx
// renders the question text once as a visually-hidden <legend> (the
// accessible name) and once as an aria-hidden <p> (the visible heading),
// so exactly one copy should reach the accessibility tree per question.
describe('QuizQuestion label accessibility', () => {
  it.each(QUESTIONS)('exposes "$text" to assistive tech exactly once', (question) => {
    const { container } = render(
      <QuizQuestion question={question} value={question.multi ? [] : undefined} onChange={() => {}} />
    );

    const matches = [...container.querySelectorAll('*')].filter(
      (el) => el.children.length === 0 && el.textContent.trim() === question.text
    );
    const exposedToAT = matches.filter((el) => el.closest('[aria-hidden="true"]') === null);
    expect(exposedToAT).toHaveLength(1);
  });
});
