import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

// cobe talks to a real WebGL context, which jsdom doesn't implement. Globe
// is lazy-loaded behind a Suspense boundary (see HeroBackground.jsx)
// specifically so a synchronous render like this one never has to mount it
// — this mock is a defensive backstop in case that ever changes.
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
