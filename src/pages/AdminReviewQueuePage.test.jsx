import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AdminReviewQueuePage from './AdminReviewQueuePage.jsx';

const ADMIN_USER = { id: 'admin-1' };
const NON_ADMIN_USER = { id: 'user-2' };

let session = null;
let memberRow = null;

function makeSupabaseMock() {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: vi.fn((table) => {
      if (table === 'verified_members') {
        return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: memberRow }) }) }) };
      }
      if (table === 'missionary_profiles' || table === 'church_profiles') {
        return { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) }) };
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
  session = null;
  memberRow = null;
  mockSupabase = makeSupabaseMock();
});

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<div>Homepage</div>} />
        <Route path="/admin/review-queue" element={<AdminReviewQueuePage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AdminReviewQueuePage', () => {
  it('redirects a signed-out visitor to the homepage', async () => {
    renderAt('/admin/review-queue');
    await waitFor(() => screen.getByText('Homepage'));
  });

  it('redirects a signed-in non-admin to the homepage', async () => {
    session = { user: NON_ADMIN_USER };
    memberRow = null;
    renderAt('/admin/review-queue');
    await waitFor(() => screen.getByText('Homepage'));
  });

  it('redirects a revoked admin to the homepage', async () => {
    session = { user: NON_ADMIN_USER };
    memberRow = { is_admin: true, revoked_at: '2024-01-01T00:00:00Z' };
    renderAt('/admin/review-queue');
    await waitFor(() => screen.getByText('Homepage'));
  });

  it('renders the review queue for an active admin', async () => {
    session = { user: ADMIN_USER };
    memberRow = { is_admin: true, revoked_at: null };
    renderAt('/admin/review-queue');
    await waitFor(() => screen.getByText('Review queue'));
    expect(screen.getByText('No missionary profiles are pending review.')).toBeInTheDocument();
  });
});
