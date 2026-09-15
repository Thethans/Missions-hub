import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingMapPreview from './LandingMapPreview.jsx';

function mockFetch() {
  return vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve([{ agency: 'IMB' }, { agency: 'Pioneers' }, { agency: 'IMB' }])
    })
  );
}

describe('LandingMapPreview', () => {
  beforeEach(() => {
    global.fetch = mockFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders real opportunity/agency counts from the fetched data, not placeholders', async () => {
    render(
      <MemoryRouter>
        <LandingMapPreview />
      </MemoryRouter>
    );

    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByText('opportunities')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('agencies')).toBeInTheDocument();
  });

  it('shows nothing instead of crashing when the opportunity data fails to load', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('network down')));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <LandingMapPreview />
      </MemoryRouter>
    );

    // Real link/lede content is still there regardless of the stats fetch.
    expect(await screen.findByRole('link', { name: /explore the full map/i })).toBeInTheDocument();
    expect(screen.queryByText('opportunities')).not.toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('links to the real map, not a functioning preview', async () => {
    render(
      <MemoryRouter>
        <LandingMapPreview />
      </MemoryRouter>
    );

    const link = await screen.findByRole('link', { name: /explore the full map/i });
    expect(link).toHaveAttribute('href', '/map');
  });

  it('renders the quiz CTA linking to /quiz', async () => {
    render(
      <MemoryRouter>
        <LandingMapPreview />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /take the quiz/i })).toHaveAttribute('href', '/quiz');
  });
});
