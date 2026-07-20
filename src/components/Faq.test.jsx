import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Faq from './Faq.jsx';

// WAI-ARIA APG accordion pattern: native <button> trigger wrapped in a
// heading, aria-expanded reflecting open/closed state, aria-controls/id
// tying the trigger to its panel, and the panel referencing the trigger
// back via aria-labelledby.
describe('Faq accordion accessibility', () => {
  it('wraps each trigger in a heading and wires aria-expanded/aria-controls to the panel', () => {
    render(<Faq />);

    const triggers = screen.getAllByRole('button');
    expect(triggers.length).toBeGreaterThan(0);

    for (const trigger of triggers) {
      expect(trigger.tagName).toBe('BUTTON');
      expect(trigger.closest('h3')).not.toBeNull();
      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      const panelId = trigger.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      const panel = document.getElementById(panelId);
      expect(panel).not.toBeNull();
      expect(panel.getAttribute('aria-labelledby')).toBe(trigger.id);
    }
  });

  it('expands the panel and updates aria-expanded/aria-hidden on activation, collapses again on a second activation', async () => {
    const user = userEvent.setup();
    render(<Faq />);

    const trigger = screen.getAllByRole('button')[0];
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));

    expect(panel.getAttribute('aria-hidden')).toBe('true');

    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.getAttribute('aria-hidden')).toBe('false');

    await user.click(trigger);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
  });

  it('is reachable by Tab and toggles with Enter and Space, with focus never leaving the trigger', async () => {
    const user = userEvent.setup();
    render(<Faq />);

    const trigger = screen.getAllByRole('button')[0];
    const panel = document.getElementById(trigger.getAttribute('aria-controls'));

    await user.tab();
    expect(trigger).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(panel.getAttribute('aria-hidden')).toBe('false');
    expect(trigger).toHaveFocus();

    await user.keyboard(' ');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(trigger).toHaveFocus();
  });
});
