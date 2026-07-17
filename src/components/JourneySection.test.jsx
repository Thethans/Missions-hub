import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import JourneySection from './JourneySection.jsx';
import { JOURNEY_STEPS } from '../data/journeySteps.js';

// Each step numeral ("01", "02"...) used to render three times per step
// (a decorative watermark, the content numeral, and the scroll-lane dot),
// all exposed to assistive tech — a screen reader would announce "zero one
// zero one" per step. Only one of the three should remain in the
// accessibility tree; the other two must be aria-hidden.
describe('JourneySection numeral accessibility', () => {
  it('exposes each step numeral to assistive tech exactly once', () => {
    const { container } = render(<JourneySection />);

    for (const step of JOURNEY_STEPS) {
      const matches = [...container.querySelectorAll('*')].filter(
        (el) => el.children.length === 0 && el.textContent.trim() === step.n
      );
      expect(matches.length).toBeGreaterThan(1); // sanity check: the repeat still exists visually

      const exposedToAT = matches.filter((el) => el.closest('[aria-hidden="true"]') === null);
      expect(exposedToAT).toHaveLength(1);
    }
  });
});
