import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsStrip from './StatsStrip.jsx';
import statsData from '../data/stats.json';

describe('StatsStrip', () => {
  beforeEach(() => {
    // Proves the real numbers don't depend on a network round-trip: if the
    // component still called fetch() anywhere, this would make it obvious.
    global.fetch = vi.fn(() => Promise.reject(new Error('should not be called')));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the real stat numbers immediately, with no async wait', () => {
    render(<StatsStrip />);

    expect(screen.getByText(statsData.unreachedGroups.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(statsData.unreachedPopulation.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText(statsData.unreachedCountries.toLocaleString())).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('renders the three stat labels', () => {
    render(<StatsStrip />);

    expect(screen.getByText('Unreached people groups')).toBeInTheDocument();
    expect(screen.getByText('People still waiting to hear')).toBeInTheDocument();
    expect(screen.getByText('Countries represented')).toBeInTheDocument();
  });
});
