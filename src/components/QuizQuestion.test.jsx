import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QuizQuestion from './QuizQuestion.jsx';
import { QUESTIONS, TERM_DEFINITIONS } from '../data/quizQuestions.js';

// Mirrors QuizQuestion.jsx's own displayLabel — used to build the exact
// aria-label text below (option text can contain regex metacharacters like
// "(agency pays you)", which broke an earlier version of this test that
// matched by RegExp instead of exact string).
const displayLabel = (opt) => opt.charAt(0).toUpperCase() + opt.slice(1);

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

// Real observed failure: a native title="" attribute is invisible in
// practice (no hover affordance, ~1s delay, no touch/keyboard support) —
// users reported definitions "don't show" for terms that did have one, e.g.
// "faith-support model" under the support-raising question. Replaced with a
// visible trigger button + CSS-revealed bubble; these tests pin the new
// contract down instead of the removed attribute.
describe('QuizQuestion term tooltips', () => {
  const supportRaising = QUESTIONS.find((q) => q.key === 'supportRaising');
  const roleType = QUESTIONS.find((q) => q.key === 'roleType');

  it('renders a visible tooltip trigger (not a title attribute) for every defined term', () => {
    render(<QuizQuestion question={supportRaising} value={undefined} onChange={() => {}} />);

    for (const opt of supportRaising.options) {
      expect(TERM_DEFINITIONS[opt], `expected a definition for "${opt}"`).toBeTruthy();
      const trigger = screen.getByRole('button', { name: `What does "${displayLabel(opt)}" mean?` });
      expect(trigger).toBeInTheDocument();
      expect(trigger.closest('label').querySelector('[title]')).toBeNull();
    }
  });

  it('does not render a trigger for options with no definition (e.g. "not sure yet")', () => {
    render(<QuizQuestion question={roleType} value={[]} onChange={() => {}} />);

    expect(TERM_DEFINITIONS['not sure yet']).toBeUndefined();
    const label = screen.getByText('Not sure yet').closest('label');
    expect(label.querySelector('.term-tooltip-trigger')).toBeNull();
  });

  it('clicking the tooltip trigger shows the definition without toggling the option', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<QuizQuestion question={supportRaising} value={undefined} onChange={onChange} />);

    const term = supportRaising.options[0];
    const trigger = screen.getByRole('button', { name: `What does "${displayLabel(term)}" mean?` });
    await user.click(trigger);

    // Scoped to this option's own tooltip wrapper — every option has a
    // (CSS-hidden-until-hover) tooltip in the DOM at once, so an unscoped
    // screen.getByRole('tooltip') would find all three and fail.
    const bubble = within(trigger.closest('.term-tooltip')).getByRole('tooltip');
    expect(bubble).toHaveTextContent(TERM_DEFINITIONS[term]);
    expect(onChange).not.toHaveBeenCalled();
  });
});
