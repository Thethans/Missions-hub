import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

// cobe talks to a real WebGL context, which jsdom doesn't implement.
// HeroBackground.jsx no longer renders Globe.jsx (replaced by the inline-SVG
// "Living Atlas" — see HeroBackground.jsx), so nothing in this render tree
// imports cobe today; this mock stays as a defensive backstop in case
// Globe.jsx (still in the codebase, reserved for a future flagship moment)
// gets wired back in.
vi.mock('cobe', () => ({
  default: () => ({ update: () => {}, destroy: () => {} })
}));

describe('App', () => {
  it('renders the home page without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // Nav chrome (RootLayout) and home-page-specific content should both be
    // present — confirms routing + the eager HomePage tree both mount. (The
    // hero tagline "Get to the field." isn't used here since RootLayout's
    // visually-hidden route announcement also contains that phrase.)
    expect(screen.getByRole('link', { name: /fielded/i })).toBeInTheDocument();
    expect(screen.getByText(/find the people still waiting to hear/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /take the quiz/i })).toBeInTheDocument();
  });
});
