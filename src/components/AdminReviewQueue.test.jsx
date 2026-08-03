import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminReviewQueue from './AdminReviewQueue.jsx';

const MISSIONARY_ROW = {
  id: 'missionary-1',
  display_name: 'Jane Doe',
  agency_name: 'Agency X',
  field_region: 'West Africa',
  field_visibility: 'region_only',
  home_base_city: 'Austin',
  home_base_state: 'TX',
  support_target_monthly: 4000,
  support_raised_pct: 50,
  family_size: 3,
  bio: 'A short bio.',
  missionary_doctrinal_tags: [{ doctrinal_tags: { label: "Believer's Baptism" } }]
};

const CHURCH_ROW = {
  id: 'church-1',
  church_name: 'First Church',
  city: 'Dallas',
  state: 'TX',
  denomination: 'Baptist',
  giving_capacity_tier: 'medium',
  church_doctrinal_tags: []
};

let missionaryRows;
let churchRows;
let updateMissionary;
let updateChurch;

function makeSupabaseMock() {
  updateMissionary = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));
  updateChurch = vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) }));

  return {
    from: vi.fn((table) => {
      if (table === 'missionary_profiles') {
        return {
          select: () => ({
            eq: () => ({ order: () => Promise.resolve({ data: missionaryRows, error: null }) })
          }),
          update: updateMissionary
        };
      }
      if (table === 'church_profiles') {
        return {
          select: () => ({
            eq: () => ({ order: () => Promise.resolve({ data: churchRows, error: null }) })
          }),
          update: updateChurch
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
  missionaryRows = [MISSIONARY_ROW];
  churchRows = [CHURCH_ROW];
  mockSupabase = makeSupabaseMock();
});

describe('AdminReviewQueue', () => {
  it('lists pending missionary and church profiles with their submitted fields and tags', async () => {
    render(<AdminReviewQueue />);
    await waitFor(() => screen.getByText('Jane Doe'));
    expect(screen.getByText('Agency X')).toBeInTheDocument();
    expect(screen.getByText("Believer's Baptism")).toBeInTheDocument();

    expect(screen.getByText('First Church')).toBeInTheDocument();
    expect(screen.getByText('Baptist')).toBeInTheDocument();
    expect(screen.getByText('No doctrinal tags selected.')).toBeInTheDocument();
  });

  it('shows an empty state when nothing is pending', async () => {
    missionaryRows = [];
    churchRows = [];
    mockSupabase = makeSupabaseMock();
    render(<AdminReviewQueue />);
    await waitFor(() => screen.getByText('No missionary profiles are pending review.'));
    expect(screen.getByText('No church profiles are pending review.')).toBeInTheDocument();
  });

  it('approving a missionary profile sets status=approved and removes it from the queue', async () => {
    const user = userEvent.setup();
    render(<AdminReviewQueue />);
    await waitFor(() => screen.getByText('Jane Doe'));

    await user.click(screen.getAllByRole('button', { name: /approve/i })[0]);

    await waitFor(() => expect(updateMissionary).toHaveBeenCalledWith({ status: 'approved' }));
    await waitFor(() => expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument());
  });

  it('rejecting a church profile sets status=rejected and removes it from the queue', async () => {
    const user = userEvent.setup();
    render(<AdminReviewQueue />);
    await waitFor(() => screen.getByText('First Church'));

    await user.click(screen.getAllByRole('button', { name: /reject/i })[1]);

    await waitFor(() => expect(updateChurch).toHaveBeenCalledWith({ status: 'rejected' }));
    await waitFor(() => expect(screen.queryByText('First Church')).not.toBeInTheDocument());
  });
});
