import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import OpportunitiesExplorer from './OpportunitiesExplorer.jsx';

// Surfaces the current URL search params as text so tests can assert on the
// page/filter/sort state the component syncs into the URL, without reaching
// into MemoryRouter's private history internals.
function LocationDisplay() {
  const [params] = useSearchParams();
  return <div data-testid="url-params">{params.toString()}</div>;
}

// The no-quiz-result "Start with a quick quiz" hint links to /quiz via
// react-router's <Link>, so every render needs a Router ancestor.
function renderExplorer(Component, props, { initialEntries } = {}) {
  const Explorer = Component || OpportunitiesExplorer;
  return render(
    <MemoryRouter initialEntries={initialEntries || ['/']}>
      <Explorer {...props} />
      <LocationDisplay />
    </MemoryRouter>
  );
}

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
// opportunities-table query actually awaits — so only range() needs to
// resolve there. saved_opportunities uses a shorter select().eq() chain (no
// range/order), so it gets its own small builder.
//
// authSession/onAuthStateChange default to signed-out (null session, no-op
// unsubscribe) since most tests don't care about auth at all.
function makeSupabaseMock({ opportunityPages = [{ data: [], error: null }], savedIds = [], authSession = null } = {}) {
  let call = 0;
  const opportunitiesBuilder = {
    select: () => opportunitiesBuilder,
    eq: () => opportunitiesBuilder,
    order: () => opportunitiesBuilder,
    range: () => Promise.resolve(opportunityPages[Math.min(call++, opportunityPages.length - 1)])
  };

  const savedOpportunities = {
    select: () => ({
      eq: () => Promise.resolve({ data: savedIds.map((id) => ({ opportunity_id: id })), error: null })
    }),
    upsert: vi.fn(() => Promise.resolve({ error: null })),
    delete: () => ({ match: vi.fn(() => Promise.resolve({ error: null })) })
  };

  return {
    from: vi.fn((table) => (table === 'saved_opportunities' ? savedOpportunities : opportunitiesBuilder)),
    auth: {
      getSession: () => Promise.resolve({ data: { session: authSession } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    _savedOpportunities: savedOpportunities
  };
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

    renderExplorer(OpportunitiesExplorer, { agencyFilter: "" });

    expect(screen.getByText(/loading opportunities/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Cached Fallback Opportunity')).toBeInTheDocument();
    });
  }, TIMEOUT);

  it('never calls Supabase when the fresh-fetch flag is off, even with a client configured', async () => {
    mockSupabase = makeSupabaseMock({ opportunityPages: [{ data: [], error: null }] });

    renderExplorer(OpportunitiesExplorer, { agencyFilter: "" });

    await waitFor(() => {
      expect(screen.getByText('Cached Fallback Opportunity')).toBeInTheDocument();
    });
    expect(mockSupabase.from).not.toHaveBeenCalled();
  }, TIMEOUT);

  it('replaces the fallback snapshot with live data on a successful background refresh when the flag is on', async () => {
    const FreshFetchExplorer = await importWithFreshFetchFlag('true');
    mockSupabase = makeSupabaseMock({
      opportunityPages: [
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
      ]
    });

    renderExplorer(FreshFetchExplorer, { agencyFilter: "" });

    await waitFor(() => {
      expect(screen.getByText('Freshly Fetched Opportunity')).toBeInTheDocument();
    });
    expect(screen.queryByText(/couldn't reach live listings/i)).not.toBeInTheDocument();
  }, TIMEOUT);

  it('keeps showing the fallback snapshot and surfaces an inline notice when the background refresh errors', async () => {
    const FreshFetchExplorer = await importWithFreshFetchFlag('true');
    mockSupabase = makeSupabaseMock({ opportunityPages: [{ data: null, error: { message: 'RLS policy violation' } }] });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderExplorer(FreshFetchExplorer, { agencyFilter: "" });

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

    renderExplorer(OpportunitiesExplorer, { agencyFilter: "" });

    await waitFor(() => {
      expect(screen.getByText('Cached Fallback Opportunity')).toBeInTheDocument();
    });
    expect(screen.queryByText(/couldn't reach live listings/i)).not.toBeInTheDocument();
  }, TIMEOUT);

  it('shows an error state when even the fallback snapshot fails to load', async () => {
    mockSupabase = null;
    mockFallbackFetch(null, false); // fetch resolves but !res.ok
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderExplorer(OpportunitiesExplorer, { agencyFilter: "" });

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

// Scoped to the card header's agency label specifically — a plain
// /Agency$/ text query also matches each card's "Inquire with {agency}"
// button now that P2-C gives that button an object.
function agencyOrder() {
  return [...document.querySelectorAll('.opp-card-agency')].map((el) => el.textContent);
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
    renderExplorer(OpportunitiesExplorer, { agencyFilter: "" });

    await waitFor(() => {
      expect(screen.getByText('Zed Role')).toBeInTheDocument();
    });
    expect(agencyOrder()).toEqual(['Zed Agency', 'Alpha Agency', 'Mid Agency']);
    expect(screen.queryByText(/sorted by your quiz matches/i)).not.toBeInTheDocument();
  }, TIMEOUT);

  it('re-sorts alphabetically when Agency A–Z is chosen', async () => {
    const user = userEvent.setup();
    renderExplorer(OpportunitiesExplorer, { agencyFilter: "" });

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

    renderExplorer(OpportunitiesExplorer, { agencyFilter: "" });

    await waitFor(() => {
      expect(screen.getByText('Zed Role')).toBeInTheDocument();
    });

    expect(screen.getByText(/sorted by your quiz matches/i)).toBeInTheDocument();
    expect(agencyOrder()).toEqual(['Zed Agency', 'Mid Agency', 'Alpha Agency']);
    expect(within(screen.getByLabelText(/sort opportunities by/i)).getByRole('option', { name: 'Relevance' })).toBeInTheDocument();
  }, TIMEOUT);
});

const FAVORITES_SAMPLE = [
  { id: 'opp-local', agency: 'Local Agency', title: 'Locally Saved Opportunity', url: 'https://example.org/local', location: null, region: null, role_type: null, term_length: null, description: null },
  { id: 'opp-remote', agency: 'Remote Agency', title: 'Remotely Saved Opportunity', url: 'https://example.org/remote', location: null, region: null, role_type: null, term_length: null, description: null }
];

const SESSION = { user: { id: 'user-1' } };

describe('OpportunitiesExplorer auth-linked favorites', () => {
  beforeEach(() => {
    mockSupabase = null;
    mockFallbackFetch(FAVORITES_SAMPLE);
    vi.stubEnv('VITE_ENABLE_FRESH_FETCH', 'false');
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it('saves to localStorage only when signed out, never touching Supabase', async () => {
    const user = userEvent.setup();
    mockSupabase = makeSupabaseMock({ opportunityPages: [{ data: [], error: null }] });

    renderExplorer(OpportunitiesExplorer, { agencyFilter: "" });
    await waitFor(() => screen.getByText('Locally Saved Opportunity'));

    await user.click(screen.getAllByLabelText('Save opportunity')[0]);

    expect(JSON.parse(localStorage.getItem('fielded_saved_opps'))).toContain('opp-local');
    expect(mockSupabase._savedOpportunities.upsert).not.toHaveBeenCalled();
  }, TIMEOUT);

  it('merges localStorage favorites into Supabase on first sign-in without clobbering either side', async () => {
    localStorage.setItem('fielded_saved_opps', JSON.stringify(['opp-local']));
    mockSupabase = makeSupabaseMock({
      opportunityPages: [{ data: [], error: null }],
      savedIds: ['opp-remote'],
      authSession: SESSION
    });

    renderExplorer(OpportunitiesExplorer, { agencyFilter: "" });
    await waitFor(() => screen.getByText('Locally Saved Opportunity'));

    await waitFor(() => {
      expect(mockSupabase._savedOpportunities.upsert).toHaveBeenCalledWith(
        [{ user_id: 'user-1', opportunity_id: 'opp-local' }],
        { onConflict: 'user_id,opportunity_id' }
      );
    });

    // Both the locally-saved and remotely-saved opportunity now show as saved.
    await waitFor(() => {
      const saveButtons = screen.getAllByLabelText('Remove from saved');
      expect(saveButtons).toHaveLength(2);
    });
  }, TIMEOUT);

  it('writes toggles to Supabase (not localStorage-only) once signed in', async () => {
    const user = userEvent.setup();
    mockSupabase = makeSupabaseMock({
      opportunityPages: [{ data: [], error: null }],
      savedIds: [],
      authSession: SESSION
    });

    renderExplorer(OpportunitiesExplorer, { agencyFilter: "" });
    await waitFor(() => screen.getByText('Locally Saved Opportunity'));

    await user.click(screen.getAllByLabelText('Save opportunity')[0]);

    expect(mockSupabase._savedOpportunities.upsert).toHaveBeenCalledWith(
      { user_id: 'user-1', opportunity_id: 'opp-local' },
      { onConflict: 'user_id,opportunity_id' }
    );
  }, TIMEOUT);
});

// 3 agencies × 10 opportunities each = 30, so pagination (24/page) and the
// round-robin interleave both have something non-trivial to prove against.
const AGENCY_NAMES = ['Agency A', 'Agency B', 'Agency C'];
const PAGINATION_SAMPLE = Array.from({ length: 30 }, (_, i) => ({
  id: `opp-${i}`,
  agency: AGENCY_NAMES[i % 3],
  title: `Opp ${i}`,
  url: `https://example.org/${i}`,
  location: null,
  // Region/role/term values must be ones the generated component's static
  // REGIONS/ROLE_TYPES/TERM_LENGTHS lists actually contain (they're baked in
  // from real Supabase data at build time, not derived from this fixture) —
  // otherwise no matching filter chip renders at all.
  region: i % 2 === 0 ? 'Sub-Saharan Africa' : 'Europe',
  role_type: i % 2 === 0 ? 'medical' : 'administration',
  term_length: i % 2 === 0 ? 'short-term (under 2 years)' : 'career/long-term',
  description: null
}));

describe('OpportunitiesExplorer pagination, URL sync, and facet counts', () => {
  beforeEach(() => {
    mockSupabase = null;
    mockFallbackFetch(PAGINATION_SAMPLE);
    vi.stubEnv('VITE_ENABLE_FRESH_FETCH', 'false');
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it('shows 24 cards on page 1 and the rest on page 2, with a pager', async () => {
    renderExplorer(OpportunitiesExplorer, { agencyFilter: '' });
    await waitFor(() => screen.getByText('Opp 0'));

    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(24);
    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6);
    });
    expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
  }, TIMEOUT);

  it('syncs the current page into the URL so it is shareable/reloadable', async () => {
    renderExplorer(OpportunitiesExplorer, { agencyFilter: '' });
    await waitFor(() => screen.getByText('Opp 0'));

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByTestId('url-params').textContent).toContain('page=2');
    });
  }, TIMEOUT);

  it('honors a page number already present in the URL on load', async () => {
    renderExplorer(OpportunitiesExplorer, { agencyFilter: '' }, { initialEntries: ['/?page=2'] });

    await waitFor(() => {
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
    });
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(6);
  }, TIMEOUT);

  it('interleaves by agency by default instead of grouping all of one agency first', async () => {
    renderExplorer(OpportunitiesExplorer, { agencyFilter: '' });
    await waitFor(() => screen.getByText('Opp 0'));

    const cardTitles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    const firstThreeAgencies = cardTitles.slice(0, 3).map((t) => AGENCY_NAMES[Number(t.replace('Opp ', '')) % 3]);
    // Interleaved: the first 3 cards should be one from each agency, not
    // all "Agency A" (which is what raw alphabetical-by-agency would give).
    expect(new Set(firstThreeAgencies).size).toBe(3);
  }, TIMEOUT);

  it('shows facet counts on filter chips reflecting the other active filters', async () => {
    const user = userEvent.setup();
    renderExplorer(OpportunitiesExplorer, { agencyFilter: '' });
    await waitFor(() => screen.getByText('Opp 0'));

    await user.click(screen.getByRole('button', { name: /filters/i }));

    const agencyChip = screen.getByRole('button', { name: /^Agency A/ });
    expect(within(agencyChip).getByText('(10)')).toBeInTheDocument();

    // Narrow to Sub-Saharan Africa (15 of the 30 rows), then Agency A's facet
    // count should drop to the 5 Agency A rows also in that region.
    await user.click(screen.getByRole('button', { name: /^Sub-Saharan Africa/ }));
    await waitFor(() => {
      expect(within(screen.getByRole('button', { name: /^Agency A/ })).getByText('(5)')).toBeInTheDocument();
    });
  }, TIMEOUT);

  it('formats the results count with a thousands separator and keeps it visually separate from the Filters button', async () => {
    renderExplorer(OpportunitiesExplorer, { agencyFilter: '' });
    await waitFor(() => screen.getByText(/30 opportunities/));
    expect(screen.getByText(/30 opportunities/).textContent).not.toMatch(/Filters/);
  }, TIMEOUT);
});

const CTA_SAMPLE = [
  { id: 'cta-1', agency: 'Africa Inland Mission (AIM)', title: 'Field Role', url: 'https://example.org/1', location: null, region: null, role_type: null, term_length: null, description: null },
  { id: 'cta-2', agency: 'Cru (Campus Crusade for Christ)', title: 'Campus Role', url: 'https://example.org/2', location: null, region: null, role_type: null, term_length: null, description: null },
  { id: 'cta-3', agency: 'ABWE', title: 'Field Role Two', url: 'https://example.org/3', location: null, region: null, role_type: null, term_length: null, description: null }
];

describe('OpportunitiesExplorer card CTAs (P2-C)', () => {
  beforeEach(() => {
    mockSupabase = null;
    mockFallbackFetch(CTA_SAMPLE);
    vi.stubEnv('VITE_ENABLE_FRESH_FETCH', 'false');
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it('gives the primary button an object, deriving a short agency name from the source name itself', async () => {
    renderExplorer(OpportunitiesExplorer, { agencyFilter: '' });
    await waitFor(() => screen.getByText('Field Role'));

    // "(AIM)" is all-caps — treated as the real acronym.
    expect(screen.getByRole('button', { name: 'Inquire with AIM' })).toBeInTheDocument();
    // "(Campus Crusade for Christ)" isn't an acronym — falls back to the
    // text before the parens rather than inventing/lengthening the name.
    expect(screen.getByRole('button', { name: 'Inquire with Cru' })).toBeInTheDocument();
    // No parens at all — the full name is already short.
    expect(screen.getByRole('button', { name: 'Inquire with ABWE' })).toBeInTheDocument();
  }, TIMEOUT);

  it('keeps "View details" as a distinct secondary link, not merged into the primary button', async () => {
    renderExplorer(OpportunitiesExplorer, { agencyFilter: '' });
    await waitFor(() => screen.getByText('Field Role'));

    const detailsLinks = screen.getAllByRole('link', { name: /view details/i });
    expect(detailsLinks.length).toBeGreaterThan(0);
    expect(detailsLinks[0].textContent).not.toMatch(/Inquire/);
  }, TIMEOUT);
});
