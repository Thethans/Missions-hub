import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Capabilities from './Capabilities.jsx';
import agencies from '../data/agencies.json';
import { QUESTIONS } from '../data/quizQuestions.js';

// P3-B: this copy used to hardcode "14 researched sending agencies" while
// agencies.json already had 28 real entries — now it reads both counts
// from the same files the quiz itself uses, so it can't drift again.
describe('Capabilities', () => {
  it('cites the real question and agency counts, not hardcoded numbers', () => {
    render(<Capabilities />);
    expect(
      screen.getByText(new RegExp(`${QUESTIONS.length} questions, ${agencies.length} researched sending agencies`))
    ).toBeInTheDocument();
  });
});
