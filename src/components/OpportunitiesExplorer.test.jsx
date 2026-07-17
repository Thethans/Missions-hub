import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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

const FALLBACK_SAMPLE = [
  {
    id: 'fallback-1',
    agency: 'Fallback Agency',
    title: 'Cached Fallback Opportunity',
    url: 'https://example.org/fallback',
    location: null,
    region: null,
    role_type: null,
    term_length: null,
    description: null
  }
];

// Opportunities data now ships as a static asset (public/data/opportunities-
// fallback.json) fetched at runtime — see OpportunitiesExplorer.template.jsx
// — rather than a JS literal baked into the component, so every test needs a
// fetch() mock for it.
function mockFallbackFetch(data = FALLBACK_SAMPLE, ok = true) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok,
      status: ok ? 200 : 500,
      statusText: ok ? 'OK' : 'Internal Server Error',
      json: () => Promise.resolve(data)
    })
  );
}

let mockSupabase = null;
vi.mock('../supabaseClient.js', () => ({
  get supabase() {
    return mockSupabase;
  }
}));

const TIMEOUT = 10000;

describe('OpportunitiesExplorer', () => {
  beforeEach(() => {
    mockSupabase = null;
    mockFallbackFetch();
    // window.__PRELOADED__ (src/utils/preloadedData.js) is a module-scope
    // singleton the component writes to once it has data — without
    // resetting it, one test's fetched opportunities would leak into the
    // next test's initial render and skip its fetch entirely.
    delete window.__PRELOADED__;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a loading state, then the fallback snapshot, before any live fetch resolves', async () => {
    mockSupabase = null; // fallback fetch is the only data source

    render(<OpportunitiesExplorer agencyFilter="" />);

    expect(screen.getByText(/loading opportunities/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Cached Fallback Opportunity')).toBeInTheDocument();
    });
  }, TIMEOUT);

  it('replaces the fallback snapshot with live data on a successful fetch', async () => {
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
  }, TIMEOUT);

  it('keeps showing the fallback snapshot and surfaces an inline notice when the live fetch errors', async () => {
    mockSupabase = makeSupabaseMock([{ data: null, error: { message: 'RLS policy violation' } }]);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<OpportunitiesExplorer agencyFilter="" />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't reach live listings/i)).toBeInTheDocument();
    });
    // Fallback data (loaded via fetch) is still rendered — the live-fetch
    // error path must never leave the list empty.
    expect(screen.getByText('Cached Fallback Opportunity')).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();
  }, TIMEOUT);

  it('renders the fallback snapshot with no Supabase client configured', async () => {
    mockSupabase = null;

    render(<OpportunitiesExplorer agencyFilter="" />);

    await waitFor(() => {
      expect(screen.getByText('Cached Fallback Opportunity')).toBeInTheDocument();
    });
    expect(screen.queryByText(/couldn't reach live listings/i)).not.toBeInTheDocument();
  }, TIMEOUT);

  it('shows an error state when even the fallback snapshot fails to load', async () => {
    mockSupabase = null;
    mockFallbackFetch(null, false); // fetch resolves but !res.ok
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<OpportunitiesExplorer agencyFilter="" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/couldn't load opportunities/i);
    });
    expect(consoleError).toHaveBeenCalled();
  }, TIMEOUT);
});
