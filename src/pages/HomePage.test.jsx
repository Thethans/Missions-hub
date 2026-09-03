import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage.jsx';

// Same jsdom-has-no-WebGL stub used by MapPage.test.jsx / LandingMapPreview.test.jsx.
vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(function MockMap() {
      return new Proxy(
        {},
        {
          get(target, prop) {
            if (prop === 'on' || prop === 'once') return () => {};
            if (prop === 'getCanvas') return () => ({ style: {} });
            if (!(prop in target)) target[prop] = vi.fn();
            return target[prop];
          }
        }
      );
    })
  }
}));

describe('HomePage', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() => Promise.resolve({ json: () => Promise.resolve([]) }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the story chapters, the map preview, and the quiz CTA — in that order — with no leftover marketing sections', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // LandingMapPreview (and the quiz CTA inside it) is lazy-loaded — see
    // HomePage.jsx's comment on why (keeps maplibre-gl out of the eager
    // story-chapter chunk) — so its content only appears once that chunk's
    // dynamic import resolves.
    await screen.findByRole('heading', { name: /which agency is worth a conversation/i }, { timeout: 3000 });

    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    const quizCtaIndex = headings.findIndex((t) => /which agency is worth a conversation/i.test(t));

    // The funnel's final beat (quiz CTA) must come after the story chapters
    // render — a crude but effective proxy for "story, then map, then quiz"
    // given the chapters don't share a stable heading level to assert order
    // against directly.
    expect(quizCtaIndex).toBe(headings.length - 1);

    // Sections explicitly removed from the landing funnel (kept in the
    // codebase, just not rendered here) must not appear.
    expect(screen.queryByText(/see where the need is/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /questions worth answering/i })).not.toBeInTheDocument();
  });

  it('links the quiz CTA to /quiz', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const quizLinks = await screen.findAllByRole('link', { name: /take the quiz/i });
    expect(quizLinks.length).toBeGreaterThanOrEqual(2);
    quizLinks.forEach((link) => expect(link).toHaveAttribute('href', '/quiz'));
  });
});
