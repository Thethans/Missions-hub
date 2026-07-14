import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import OpportunitiesExplorer from './OpportunitiesExplorer.jsx';

// Mirrors the shape of a chained Supabase query builder: from/select/eq/order
// all return the same chainable object, and range() is the terminal call the
// component actually awaits — so only range() needs to resolve.
function makeSupabaseMock(pages) {
  let call = 0;
  const builder = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    range: () => Promise.resolve(pages[Math.min(call++, pages.length - 1)])
  };
  return { from: vi.fn(() => builder) };
}

let mockSupabase = null;
vi.mock('../supabaseClient.js', () => ({
  get supabase() {
    return mockSupabase;
  }
}));

// OpportunitiesExplorer.jsx is auto-generated with ~16k lines of baked-in
// fallback data (see generate-component.js) — parsing/rendering it is
// noticeably slower than a normal component, so the default 5s timeout is
// too tight on a loaded or CI-slow machine. 15s gives real headroom without
// masking an actual hang (which would still exceed it).
const SLOW_TIMEOUT = 15000;

describe('OpportunitiesExplorer', () => {
  beforeEach(() => {
    mockSupabase = null;
  });

  it('replaces the baked-in snapshot with live data on a successful fetch', async () => {
    mockSupabase = makeSupabaseMock([
      {
        data: [
          {
            id: 'live-1',
            agency: 'Live Agency',
            title: 'Freshly Fetched Opportunity',
            url: 'https://example.org/opp',
            location: null,
            region: null,
            role_type: null,
            term_length: null,
            description: null
          }
        ],
        error: null
      }
    ]);

    render(<OpportunitiesExplorer agencyFilter="" />);

    await waitFor(() => {
      expect(screen.getByText('Freshly Fetched Opportunity')).toBeInTheDocument();
    });
    expect(screen.queryByText(/couldn't reach live listings/i)).not.toBeInTheDocument();
  }, SLOW_TIMEOUT);

  it('keeps showing the baked-in snapshot and surfaces an inline notice when the fetch errors', async () => {
    mockSupabase = makeSupabaseMock([{ data: null, error: { message: 'RLS policy violation' } }]);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<OpportunitiesExplorer agencyFilter="" />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't reach live listings/i)).toBeInTheDocument();
    });
    // Baked fallback data (present from initial state) is still rendered —
    // the error path must never leave the list empty.
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0);
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  }, SLOW_TIMEOUT);

  it('renders the baked-in snapshot with no network configured (no Supabase client)', () => {
    mockSupabase = null;

    render(<OpportunitiesExplorer agencyFilter="" />);

    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/couldn't reach live listings/i)).not.toBeInTheDocument();
  }, SLOW_TIMEOUT);
});
