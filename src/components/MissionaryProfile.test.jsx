import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MissionaryProfile from './MissionaryProfile.jsx';

const MISSIONARY = {
  id: 'm-1',
  display_name: 'Jane Doe',
  agency_name: 'Agency X',
  field_region: 'West Africa',
  field_visibility: 'region_only',
  verification: 'agency_verified',
  bio: 'Serving in West Africa.',
  home_base_city: 'Springfield',
  home_base_state: 'IL',
  support_target_monthly: 4000,
  support_raised_pct: 62,
  family_size: 3,
  missionary_doctrinal_tags: [{ doctrinal_tags: { id: 'credobaptist', label: "Believer's Baptism", category: 'baptism' } }]
};

const CHURCH_SESSION = { user: { id: 'church-1' } };

let missionaryRow = MISSIONARY;
let session = null;
let churchProfileRow = null;
let existingRequestRow = null;
let insertIntroRequest;

function makeSupabaseMock() {
  insertIntroRequest = vi.fn(() => Promise.resolve({ error: null }));
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getUser: () => Promise.resolve({ data: { user: session?.user || null }, error: null })
    },
    from: vi.fn((table) => {
      if (table === 'missionary_profiles') {
        return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: missionaryRow, error: null }) }) }) };
      }
      if (table === 'church_profiles') {
        return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: churchProfileRow }) }) }) };
      }
      if (table === 'intro_requests') {
        return {
          select: () => ({ eq: () => ({ eq: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: existingRequestRow }) }) }) }) }),
          insert: insertIntroRequest
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    })
  };
}

let mockSupabase = null;

vi.mock('../supabaseClient.js', () => ({
  get supabase() {
    return mockSupabase;
  }
}));

beforeEach(() => {
  missionaryRow = MISSIONARY;
  session = null;
  churchProfileRow = null;
  existingRequestRow = null;
  mockSupabase = makeSupabaseMock();
});

function renderProfile() {
  return render(
    <MemoryRouter>
      <MissionaryProfile missionaryId="m-1" />
    </MemoryRouter>
  );
}

describe('MissionaryProfile', () => {
  it('shows "not available" when the profile is null (not found or not approved, indistinguishably)', async () => {
    missionaryRow = null;
    renderProfile();
    await waitFor(() => screen.getByText(/isn't available/i));
  });

  it('renders the full profile: bio, home base, support, and doctrinal tags', async () => {
    renderProfile();
    await waitFor(() => screen.getByText('Jane Doe'));
    expect(screen.getByText('Serving in West Africa.')).toBeInTheDocument();
    expect(screen.getByText('Springfield, IL')).toBeInTheDocument();
    expect(screen.getByText(/Monthly target: \$4,000/)).toBeInTheDocument();
    expect(screen.getByText('Family size: 3')).toBeInTheDocument();
    expect(screen.getByText("Believer's Baptism")).toBeInTheDocument();
    expect(screen.getByText('Agency-verified')).toBeInTheDocument();
  });

  it('respects field_visibility private the same way as the directory', async () => {
    missionaryRow = { ...MISSIONARY, field_visibility: 'private' };
    renderProfile();
    await waitFor(() => screen.getByText('Jane Doe'));
    expect(screen.getByText('Location available on request')).toBeInTheDocument();
  });

  it('disables Request Intro with a hint when signed out', async () => {
    renderProfile();
    await waitFor(() => screen.getByRole('button', { name: /request intro/i }));
    expect(screen.getByRole('button', { name: /request intro/i })).toBeDisabled();
    expect(screen.getByText(/sign in with an approved church profile/i)).toBeInTheDocument();
  });

  it('disables Request Intro when signed in but the church profile is not approved', async () => {
    session = CHURCH_SESSION;
    churchProfileRow = { status: 'pending_review' };
    renderProfile();
    await waitFor(() => screen.getByRole('button', { name: /request intro/i }));
    expect(screen.getByRole('button', { name: /request intro/i })).toBeDisabled();
    expect(screen.getByText(/only approved churches/i)).toBeInTheDocument();
  });

  it('shows "Request pending" instead of the button when a pending request already exists', async () => {
    session = CHURCH_SESSION;
    churchProfileRow = { status: 'approved' };
    existingRequestRow = { id: 'req-1' };
    renderProfile();
    await waitFor(() => screen.getByText(/request pending/i));
    expect(screen.getByText(/request pending/i)).toBeDisabled();
  });

  it('lets an approved church open the form and submit a request', async () => {
    session = CHURCH_SESSION;
    churchProfileRow = { status: 'approved' };
    const user = userEvent.setup();
    renderProfile();

    await waitFor(() => screen.getByRole('button', { name: /request intro/i }));
    expect(screen.getByRole('button', { name: /request intro/i })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: /request intro/i }));

    await user.type(screen.getByLabelText(/message/i), 'Would love to connect.');
    await user.click(screen.getByRole('button', { name: /send request/i }));

    await waitFor(() => expect(insertIntroRequest).toHaveBeenCalledWith({
      church_id: 'church-1',
      missionary_id: 'm-1',
      message: 'Would love to connect.'
    }));
    await waitFor(() => screen.getByText(/request pending/i));
  });
});
