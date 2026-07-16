import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import HeroBackground from './HeroBackground.jsx';
import atlas from '../data/heroAtlas.json';

function mockMatchMedia({ reducedMotion = false, mobile = false } = {}) {
  window.matchMedia = vi.fn((query) => ({
    matches: query.includes('prefers-reduced-motion') ? reducedMotion : mobile,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {}
  }));
}

describe('HeroBackground (Living Atlas)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the full dot count and viewBox on desktop', () => {
    mockMatchMedia({ mobile: false });
    const { container } = render(<HeroBackground />);

    const svg = container.querySelector('.hero-atlas');
    expect(svg.getAttribute('viewBox')).toBe(atlas.viewBox);
    expect(container.querySelectorAll('.hero-atlas-dots circle')).toHaveLength(atlas.dots.length);
  });

  it('crops to the mobile viewBox and halves the dot count', () => {
    mockMatchMedia({ mobile: true });
    const { container } = render(<HeroBackground />);

    const svg = container.querySelector('.hero-atlas');
    expect(svg.getAttribute('viewBox')).not.toBe(atlas.viewBox);
    expect(container.querySelectorAll('.hero-atlas-dots circle').length).toBeLessThan(atlas.dots.length);
  });

  it('renders a pulse per sampled unreached coordinate and a path per route', () => {
    mockMatchMedia({});
    const { container } = render(<HeroBackground />);

    expect(container.querySelectorAll('.hero-atlas-pulse')).toHaveLength(atlas.pulses.length);
    expect(container.querySelectorAll('.hero-atlas-route')).toHaveLength(atlas.routes.length);
  });

  it('renders real coordinate labels on the route endpoints, not placeholder text', () => {
    mockMatchMedia({});
    const { container } = render(<HeroBackground />);

    const labels = [...container.querySelectorAll('.hero-atlas-coord')].map((el) => el.textContent);
    expect(labels.length).toBe(atlas.routes.length * 2);
    for (const label of labels) {
      expect(label).toMatch(/\d+\.\d+°[NS] \d+\.\d+°[EW]/);
    }
  });

  it('applies the static class and skips animation delays under prefers-reduced-motion', () => {
    mockMatchMedia({ reducedMotion: true });
    const { container } = render(<HeroBackground />);

    expect(container.querySelector('.hero-atlas--static')).not.toBeNull();
    const pulse = container.querySelector('.hero-atlas-pulse');
    expect(pulse.style.animationDelay).toBe('');
  });
});
