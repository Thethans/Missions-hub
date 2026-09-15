import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChapterAbyss from './ChapterAbyss.jsx';

// usePrefersReducedMotion reads window.matchMedia('(prefers-reduced-motion:
// reduce)').matches — override the vitest.setup.js default (always false)
// per test rather than mocking the hook module directly, so the real hook
// logic (including its change-listener wiring) still runs.
function setPrefersReducedMotion(matches) {
  window.matchMedia = (query) => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  });
}

describe('ChapterAbyss', () => {
  afterEach(() => {
    setPrefersReducedMotion(false);
  });

  it('renders the full scroll-jacked structure (sticky pin, void spacer, canvas) when motion is not reduced', () => {
    setPrefersReducedMotion(false);
    const { container } = render(<ChapterAbyss />);

    expect(container.querySelector('.abyss-pin')).toBeInTheDocument();
    expect(container.querySelector('.abyss-void')).toBeInTheDocument();
    expect(container.querySelector('.abyss-field')).toBeInTheDocument();
    expect(container.querySelector('.chapter-abyss--static')).not.toBeInTheDocument();
  });

  it('replaces the scroll-jacked structure with a short static panel when prefers-reduced-motion is set', () => {
    setPrefersReducedMotion(true);
    const { container } = render(<ChapterAbyss />);

    // No scroll-jacking mechanics at all — not just paused/invisible.
    expect(container.querySelector('.abyss-pin')).not.toBeInTheDocument();
    expect(container.querySelector('.abyss-void')).not.toBeInTheDocument();
    expect(container.querySelector('.abyss-field')).not.toBeInTheDocument();
    expect(container.querySelector('.chapter-abyss--static')).toBeInTheDocument();
  });

  it('keeps the same real stats and definition readable in both motion states', () => {
    setPrefersReducedMotion(true);
    const { unmount } = render(<ChapterAbyss />);
    expect(screen.getByRole('heading', { level: 2, name: /the abyss/i })).toBeInTheDocument();
    expect(screen.getByText(/an unreached people group is/i)).toBeInTheDocument();
    expect(screen.getByText(/no adequate indigenous community of believers/i)).toBeInTheDocument();
    unmount();

    setPrefersReducedMotion(false);
    render(<ChapterAbyss />);
    expect(screen.getByRole('heading', { level: 2, name: /the abyss/i })).toBeInTheDocument();
    expect(screen.getByText(/an unreached people group is/i)).toBeInTheDocument();
    expect(screen.getByText(/no adequate indigenous community of believers/i)).toBeInTheDocument();
  });
});
