import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MissionaryDashboard from './MissionaryDashboard.jsx';

const SESSION = { user: { id: 'missionary-1' } };

const PROFILE = {
  id: 'missionary-1',
  status: 'approved',
  verification: 'self_reported',
  display_name: 'Jane Doe',
  agency_name: 'Agency X',
  field_region: 'West Africa',
  field_visibility: 'region_only',
  missionary_doctrinal_tags: [{ doctrinal_tags: { id: 'credobaptist', label: "Believer's Baptism", category: 'baptism' } }]
};

const PENDING_REQUEST = {
  id: 'req-1',
  status: 'requested',
  message: 'Would love to connect.',
  created_at: '2026-01-01T00:00:00Z',
  church_profiles: { church_name: 'First Church' }
};

const PAST_REQUEST = {
  id: 'req-0',
  status: 'accepted',
  message: null,
  created_at: '2025-12-01T00:00:00Z',
  church_profiles: { church_name: 'Old Church' }
};

let session;
let profileRow;
let requestRows;
let updateRequest;

function makeSupabaseMock() {
  updateRequest = vi.fn(() => ({ eq: () => Promise.resolve({ error: null }) }));
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: vi.fn((table) => {
      if (table === 'doctrinal_tags') {
        return { select: () => ({ order: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) };
      }
      if (table === 'missionary_profiles') {
        return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: profileRow, error: null }) }) }) };
      }
      if (table === 'intro_requests') {
        return {
          select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: requestRows, error: null }) }) }),
          update: updateRequest
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
  session = SESSION;
  profileRow = PROFILE;
  requestRows = [PENDING_REQUEST];
  mockSupabase = makeSupabaseMock();
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <MissionaryDashboard />
    </MemoryRouter>
  );
}

describe('MissionaryDashboard', () => {
  it('prompts to create a profile when signed in but no missionary_profiles row exists', async () => {
    profileRow = null;
    renderDashboard();
    await waitFor(() => screen.getByText(/doesn't have a missionary profile yet/i));
  });

  it('shows the profile summary and pending intro requests', async () => {
    renderDashboard();
    await waitFor(() => screen.getByText('Jane Doe'));
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText('First Church')).toBeInTheDocument();
    expect(screen.getByText('Would love to connect.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
  });

  it('accepting a request updates status and moves it out of the pending list', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await waitFor(() => screen.getByText('First Church'));

    await user.click(screen.getByRole('button', { name: /accept/i }));

    await waitFor(() => expect(updateRequest).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'accepted' })
    ));
    await waitFor(() => expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument());
  });

  it('puts already-responded requests in a collapsed past-requests section', async () => {
    requestRows = [PENDING_REQUEST, PAST_REQUEST];
    renderDashboard();
    await waitFor(() => screen.getByText('First Church'));

    const details = screen.getByText(/past requests/i).closest('details');
    expect(details).not.toHaveAttribute('open');
    expect(screen.getByText('Old Church')).toBeInTheDocument();
  });

  it('switches to the edit form and back to the summary on save', async () => {
    const user = userEvent.setup();
    renderDashboard();
    await waitFor(() => screen.getByText('Jane Doe'));

    await user.click(screen.getByRole('button', { name: /edit profile/i }));
    await waitFor(() => screen.getByRole('button', { name: /save changes/i }));
    expect(screen.getByLabelText(/display name/i)).toHaveValue('Jane Doe');
  });
});
