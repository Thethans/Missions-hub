import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MapLegend from './MapLegend.jsx';

const BASE_PROPS = {
  counts: { unreached: 10, formative: 5, reached: 3 },
  active: new Set(['unreached', 'formative', 'reached']),
  onToggle: vi.fn(),
  religionCounts: { Buddhism: 637, 'Made-Up Category': 12 },
  religionActive: new Set(),
  onToggleReligion: vi.fn()
};

describe('MapLegend religion tooltips', () => {
  it('links a religion chip to its summary via aria-describedby, matching a real tooltip element', () => {
    render(<MapLegend {...BASE_PROPS} religions={['Buddhism']} />);

    const chip = screen.getByRole('button', { name: /buddhism/i });
    const describedById = chip.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();

    const tooltip = document.getElementById(describedById);
    expect(tooltip).toHaveAttribute('role', 'tooltip');
    expect(tooltip.textContent).toMatch(/Siddhartha Gautama/);
  });

  it('renders a real, distinct two-sentence-ish summary per religion, not placeholder text', () => {
    render(<MapLegend {...BASE_PROPS} religions={['Christianity', 'Islam']} />);

    const christianityChip = screen.getByRole('button', { name: /christianity/i });
    const islamChip = screen.getByRole('button', { name: /^islam/i });

    const christianityTooltip = document.getElementById(christianityChip.getAttribute('aria-describedby'));
    const islamTooltip = document.getElementById(islamChip.getAttribute('aria-describedby'));

    expect(christianityTooltip.textContent).toMatch(/Jesus Christ/);
    expect(islamTooltip.textContent).toMatch(/Muhammad/);
    expect(christianityTooltip.textContent).not.toEqual(islamTooltip.textContent);
  });

  it('explains category labels honestly instead of inventing a shared belief system for them', () => {
    render(<MapLegend {...BASE_PROPS} religions={['Non-Religious', 'Unknown']} />);

    const nonReligiousChip = screen.getByRole('button', { name: /non-religious/i });
    const unknownChip = screen.getByRole('button', { name: /unknown/i });

    const nonReligiousTooltip = document.getElementById(nonReligiousChip.getAttribute('aria-describedby'));
    const unknownTooltip = document.getElementById(unknownChip.getAttribute('aria-describedby'));

    expect(nonReligiousTooltip.textContent).toMatch(/not a shared belief system/i);
    expect(unknownTooltip.textContent).toMatch(/isn't a belief system/i);
  });

  it('does not render a tooltip (or crash) for a religion value with no known summary', () => {
    render(<MapLegend {...BASE_PROPS} religions={['Made-Up Category']} />);

    const chip = screen.getByRole('button', { name: /made-up category/i });
    expect(chip).not.toHaveAttribute('aria-describedby');
    expect(document.querySelector('[role="tooltip"]')).not.toBeInTheDocument();
  });
});
