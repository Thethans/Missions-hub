import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Checklist from './Checklist.jsx';

const ITEMS = [
  { id: 'item-1', category: 'legal', title: 'Get a passport', description: null, external_link: null, role_tags: [], access_tags: [], sort_order: 1 },
  { id: 'item-2', category: 'financial', title: 'Set up support raising', description: null, external_link: null, role_tags: [], access_tags: [], sort_order: 2 }
];

let mockSupabase = null;
let authStateCallback = null;

// Mirrors the chained-query-builder shape each real table call actually
// uses in Checklist.jsx (checked against the source, not guessed) —
// checklist_items is select().order(), user_checklist_profile is
// select().eq().maybeSingle() (+ upsert), user_checklist_progress is
// select().eq() (+ upsert/insert/delete().match()).
function makeSupabaseMock({ session = null, remoteProfile = null, remoteProgress = [] } = {}) {
  const upsertProfile = vi.fn(() => Promise.resolve({ error: null }));
  const upsertProgress = vi.fn(() => Promise.resolve({ error: null }));
  const insertProgress = vi.fn(() => Promise.resolve({ error: null }));
  const deleteMatch = vi.fn(() => Promise.resolve({ error: null }));

  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session } }),
      onAuthStateChange: (cb) => {
        authStateCallback = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithOtp: vi.fn(() => Promise.resolve({ error: null })),
      getUser: () => Promise.resolve({ data: { user: session?.user || null }, error: null })
    },
    from: vi.fn((table) => {
      if (table === 'checklist_items') {
        return { select: () => ({ order: () => Promise.resolve({ data: ITEMS, error: null }) }) };
      }
      if (table === 'user_checklist_profile') {
        return {
          select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: remoteProfile }) }) }),
          upsert: upsertProfile
        };
      }
      if (table === 'user_checklist_progress') {
        return {
          select: () => ({ eq: () => Promise.resolve({ data: remoteProgress.map((id) => ({ item_id: id })), error: null }) }),
          upsert: upsertProgress,
          insert: insertProgress,
          delete: () => ({ match: deleteMatch })
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    _mocks: { upsertProfile, upsertProgress, insertProgress, deleteMatch }
  };
}

vi.mock('../supabaseClient.js', () => ({
  get supabase() {
    return mockSupabase;
  }
}));

const TIMEOUT = 10000;

async function completeAnonymousProfile(user) {
  await waitFor(() => screen.getByText('A couple quick questions'));
  await user.selectOptions(screen.getByLabelText(/role type/i), 'long_term');
  await user.selectOptions(screen.getByLabelText(/destination access-level/i), 'open_access');
  await user.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => screen.getByText(/complete/i));
}

describe('Checklist — anonymous persistence', () => {
  beforeEach(() => {
    authStateCallback = null;
    mockSupabase = makeSupabaseMock({ session: null });
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('never shows a sign-in gate — goes straight to profile setup with no session', async () => {
    render(<Checklist />);
    await waitFor(() => screen.getByText('A couple quick questions'));
    expect(screen.queryByText(/sign in to your checklist/i)).not.toBeInTheDocument();
  }, TIMEOUT);

  it('saves profile + checkbox progress to localStorage instead of Supabase', async () => {
    const user = userEvent.setup();
    render(<Checklist />);
    await completeAnonymousProfile(user);

    expect(JSON.parse(localStorage.getItem('fielded_checklist_profile'))).toEqual({
      role_type: 'long_term',
      access_level: 'open_access'
    });
    // Signed out the whole time — the profile upsert must never be called.
    expect(mockSupabase._mocks.upsertProfile).not.toHaveBeenCalled();

    await user.click(screen.getAllByRole('checkbox')[0]);
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('fielded_checklist_progress'))).toEqual(['item-1']);
    });
    expect(mockSupabase._mocks.insertProgress).not.toHaveBeenCalled();
  }, TIMEOUT);

  it('restores saved anonymous progress on a fresh mount (e.g. after a reload)', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Checklist />);
    await completeAnonymousProfile(user);
    await user.click(screen.getAllByRole('checkbox')[0]);
    await waitFor(() => {
      expect(JSON.parse(localStorage.getItem('fielded_checklist_progress'))).toEqual(['item-1']);
    });
    unmount();

    render(<Checklist />);
    await waitFor(() => screen.getByText(/complete/i));
    expect(screen.getAllByRole('checkbox')[0]).toBeChecked();
    expect(screen.getByText('1 / 2 complete')).toBeInTheDocument();
  }, TIMEOUT);
});

describe('Checklist — signup prompt', () => {
  beforeEach(() => {
    authStateCallback = null;
    mockSupabase = makeSupabaseMock({ session: null });
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('does not show the prompt before any anonymous profile/progress exists', async () => {
    render(<Checklist />);
    await waitFor(() => screen.getByText('A couple quick questions'));
    expect(screen.queryByText(/create an account/i)).not.toBeInTheDocument();
  }, TIMEOUT);

  it('shows a dismissible prompt once an anonymous profile is saved, never blocking the checklist', async () => {
    const user = userEvent.setup();
    render(<Checklist />);
    await completeAnonymousProfile(user);

    expect(screen.getByText(/create an account any time/i)).toBeInTheDocument();
    // Low-pressure: the checklist itself renders right alongside the prompt.
    expect(screen.getByText('Get a passport')).toBeInTheDocument();
  }, TIMEOUT);

  it('updates the prompt copy to reflect completed-item count', async () => {
    const user = userEvent.setup();
    render(<Checklist />);
    await completeAnonymousProfile(user);
    await user.click(screen.getAllByRole('checkbox')[0]);

    await waitFor(() => {
      expect(screen.getByText(/you've checked off 1 item/i)).toBeInTheDocument();
    });
  }, TIMEOUT);

  it('dismissing the prompt hides it without touching checklist state', async () => {
    const user = userEvent.setup();
    render(<Checklist />);
    await completeAnonymousProfile(user);

    await user.click(screen.getByLabelText('Dismiss'));
    expect(screen.queryByText(/create an account/i)).not.toBeInTheDocument();
    expect(screen.getByText('Get a passport')).toBeInTheDocument();
  }, TIMEOUT);

  it('expands into the sign-in form without navigating away', async () => {
    const user = userEvent.setup();
    render(<Checklist />);
    await completeAnonymousProfile(user);

    await user.click(screen.getByRole('button', { name: /save my progress/i }));
    expect(screen.getByText(/sign in to your checklist/i)).toBeInTheDocument();
  }, TIMEOUT);
});

describe('Checklist — migration on sign-in', () => {
  beforeEach(() => {
    authStateCallback = null;
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('migrates local profile + progress into the account the first time a session appears', async () => {
    localStorage.setItem('fielded_checklist_profile', JSON.stringify({ role_type: 'long_term', access_level: 'open_access' }));
    localStorage.setItem('fielded_checklist_progress', JSON.stringify(['item-1']));

    mockSupabase = makeSupabaseMock({ session: null, remoteProfile: null, remoteProgress: [] });
    render(<Checklist />);
    await waitFor(() => screen.getByText(/complete/i));

    authStateCallback('SIGNED_IN', { user: { id: 'user-1' } });

    await waitFor(() => {
      expect(mockSupabase._mocks.upsertProfile).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 'user-1', role_type: 'long_term', access_level: 'open_access' })
      );
    });
    await waitFor(() => {
      expect(mockSupabase._mocks.upsertProgress).toHaveBeenCalledWith(
        [{ user_id: 'user-1', item_id: 'item-1' }],
        { onConflict: 'user_id,item_id' }
      );
    });
  }, TIMEOUT);

  it('never overwrites an existing remote profile with local guest data', async () => {
    localStorage.setItem('fielded_checklist_profile', JSON.stringify({ role_type: 'short_term', access_level: 'restricted_access' }));

    mockSupabase = makeSupabaseMock({
      session: null,
      remoteProfile: { user_id: 'user-1', role_type: 'long_term', access_level: 'open_access' },
      remoteProgress: []
    });
    render(<Checklist />);
    await waitFor(() => screen.getByText(/complete/i));

    authStateCallback('SIGNED_IN', { user: { id: 'user-1' } });

    // Give the migration effect a tick to (not) run.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mockSupabase._mocks.upsertProfile).not.toHaveBeenCalled();
  }, TIMEOUT);

  it('unions local progress into remote rather than requiring an exact match', async () => {
    localStorage.setItem('fielded_checklist_profile', JSON.stringify({ role_type: 'long_term', access_level: 'open_access' }));
    localStorage.setItem('fielded_checklist_progress', JSON.stringify(['item-1', 'item-2']));

    mockSupabase = makeSupabaseMock({
      session: null,
      remoteProfile: { user_id: 'user-1', role_type: 'long_term', access_level: 'open_access' },
      remoteProgress: ['item-2']
    });
    render(<Checklist />);
    await waitFor(() => screen.getByText(/complete/i));

    authStateCallback('SIGNED_IN', { user: { id: 'user-1' } });

    await waitFor(() => {
      expect(mockSupabase._mocks.upsertProgress).toHaveBeenCalledWith(
        [{ user_id: 'user-1', item_id: 'item-1' }],
        { onConflict: 'user_id,item_id' }
      );
    });
  }, TIMEOUT);
});
