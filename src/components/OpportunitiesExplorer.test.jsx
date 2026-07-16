import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OpportunitiesExplorer from './OpportunitiesExplorer.jsx';

// import.meta.env.VITE_ENABLE_FRESH_FETCH is inlined at module-transform
// time, so vi.stubEnv only takes effect on a fresh module instance —
// tests that flip the flag must reset modules and re-import dynamically
// rather than reuse the static OpportunitiesExplorer import above.
async function importWithFreshFetchFlag(value) {
  vi.stubEnv('VITE_ENABLE_FRESH_FETCH', value);
  vi.resetModules();
  const mod = await import('./OpportunitiesExplorer.jsx');
  return mod.default;
}

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
    vi.stubEnv('VITE_ENABLE_FRESH_FETCH', 'false');
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it('shows a loading state, then the fallback snapshot, before any live fetch resolves', async () => {
    mockSupabase = null; // fallback fetch is the only data source

    render(<OpportunitiesExplorer agencyFilter="" />);

    expect(screen.getByText(/loading opportunities/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Cached Fallback Opportunity')).toBeInTheDocument();
    });
  }, TIMEOUT);

  it('never calls Supabase when the fresh-fetch flag is off, even with a client configured', async () => {
    mockSupabase = makeSupabaseMock([{ data: [], error: null }]);

    render(<OpportunitiesExplorer agencyFilter="" />);

    await waitFor(() => {
      expect(screen.getByText('Cached Fallback Opportunity')).toBeInTheDocument();
    });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  }, TIMEOUT);

  it('replaces the fallback snapshot with live data on a successful background refresh when the flag is on', async () => {
    const FreshFetchExplorer = await importWithFreshFetchFlag('true');
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

    render(<FreshFetchExplorer agencyFilter="" />);

    await waitFor(() => {
      expect(screen.getByText('Freshly Fetched Opportunity')).toBeInTheDocument();
    });
    expect(screen.queryByText(/couldn't reach live listings/i)).not.toBeInTheDocument();
  }, TIMEOUT);

  it('keeps showing the fallback snapshot and surfaces an inline notice when the background refresh errors', async () => {
    const FreshFetchExplorer = await importWithFreshFetchFlag('true');
    mockSupabase = makeSupabaseMock([{ data: null, error: { message: 'RLS policy violation' } }]);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<FreshFetchExplorer agencyFilter="" />);

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

const MULTI_AGENCY_SAMPLE = [
  { id: 'a-1', agency: 'Zed Agency', title: 'Zed Role', url: 'https://example.org/z', location: null, region: null, role_type: null, term_length: null, description: null },
  { id: 'a-2', agency: 'Alpha Agency', title: 'Alpha Role', url: 'https://example.org/a', location: null, region: null, role_type: null, term_length: null, description: null },
  { id: 'a-3', agency: 'Mid Agency', title: 'Mid Role', url: 'https://example.org/m', location: null, region: null, role_type: null, term_length: null, description: null }
];

function agencyOrder() {
  return screen.getAllByText(/Agency$/).map((el) => el.textContent);
}

describe('OpportunitiesExplorer sorting', () => {
  beforeEach(() => {
    mockSupabase = null;
    mockFallbackFetch(MULTI_AGENCY_SAMPLE);
    vi.stubEnv('VITE_ENABLE_FRESH_FETCH', 'false');
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it('defaults to the static snapshot order (Recently added) with no quiz result', async () => {
    render(<OpportunitiesExplorer agencyFilter="" />);

    await waitFor(() => {
      expect(screen.getByText('Zed Role')).toBeInTheDocument();
    });
    expect(agencyOrder()).toEqual(['Zed Agency', 'Alpha Agency', 'Mid Agency']);
    expect(screen.queryByText(/sorted by your quiz matches/i)).not.toBeInTheDocument();
  }, TIMEOUT);

  it('re-sorts alphabetically when Agency A–Z is chosen', async () => {
    const user = userEvent.setup();
    render(<OpportunitiesExplorer agencyFilter="" />);

    await waitFor(() => {
      expect(screen.getByText('Zed Role')).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/sort opportunities by/i), 'agency');

    expect(agencyOrder()).toEqual(['Alpha Agency', 'Mid Agency', 'Zed Agency']);
  }, TIMEOUT);

  it('defaults to relevance and sorts by quiz match score when a saved quiz result exists', async () => {
    localStorage.setItem('fielded_quiz_result', JSON.stringify({
      answers: {},
      matches: [
        { name: 'Alpha Agency', score: 1 },
        { name: 'Zed Agency', score: 9 },
        { name: 'Mid Agency', score: 5 }
      ],
      timestamp: Date.now()
    }));

    render(<OpportunitiesExplorer agencyFilter="" />);

    await waitFor(() => {
      expect(screen.getByText('Zed Role')).toBeInTheDocument();
    });

    expect(screen.getByText(/sorted by your quiz matches/i)).toBeInTheDocument();
    expect(agencyOrder()).toEqual(['Zed Agency', 'Mid Agency', 'Alpha Agency']);
    expect(within(screen.getByLabelText(/sort opportunities by/i)).getByRole('option', { name: 'Relevance' })).toBeInTheDocument();
  }, TIMEOUT);
});
