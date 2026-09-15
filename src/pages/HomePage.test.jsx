import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from './HomePage.jsx';

// HomePage only mounts the below-the-fold story chapters (Pattern/Cost/
// Finale) once their own section is in view (see useInView.js) — jsdom's
// IntersectionObserver never fires (vitest.setup.js stubs it as a permanent
// no-op, since ChapterAbyss/RevealOnScroll etc. also use it via
// framer-motion's own useInView and nothing here should touch that shared
// global), so this reports "always in view" instead, same as a visitor
// who's already scrolled that far down.
vi.mock('../hooks/useInView.js', () => ({
  default: () => [{ current: null }, true]
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

    // The quiz CTA lives inside LandingMapPreview, whose own opportunity
    // stats come from an async fetch — wait for it to resolve.
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

  it('has a skip-intro link that targets a focusable map-preview landmark', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    const skipLink = screen.getByRole('link', { name: /skip intro/i });
    expect(skipLink).toHaveAttribute('href', '#homepage-map-preview');

    const target = document.getElementById('homepage-map-preview');
    expect(target).toBeInTheDocument();
    expect(target).toHaveAttribute('tabindex', '-1');
  });
});
