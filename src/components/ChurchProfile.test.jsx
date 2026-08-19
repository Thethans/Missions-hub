import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChurchProfile from './ChurchProfile.jsx';

const CHURCH = {
  id: 'c-1',
  church_name: 'Grace Community Church',
  city: 'Dallas',
  state: 'TX',
  denomination: 'Non-denominational',
  giving_capacity_tier: 'medium',
  website: 'https://gracecommunity.example.com',
  bio: 'A growing church seeking long-term partnerships.',
  missions_focus: 'Unreached people groups in creative-access countries.',
  contact_name: 'Priya Nair',
  contact_role: 'Global Outreach Director',
  hosts_short_term_trips: true,
  sends_teams: false,
  hosts_furloughs: true,
  church_doctrinal_tags: [{ doctrinal_tags: { id: 'credobaptist', label: "Believer's Baptism", category: 'baptism' } }]
};

let churchRow;

function makeSupabaseMock() {
  return {
    from: vi.fn((table) => {
      if (table === 'church_profiles') {
        return { select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: churchRow, error: null }) }) }) };
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
  churchRow = CHURCH;
  mockSupabase = makeSupabaseMock();
});

function renderProfile() {
  return render(
    <MemoryRouter>
      <ChurchProfile churchId="c-1" />
    </MemoryRouter>
  );
}

describe('ChurchProfile', () => {
  it('shows "not available" when the profile is null', async () => {
    churchRow = null;
    renderProfile();
    await waitFor(() => screen.getByText(/isn't available/i));
  });

  it('renders bio, missions focus, contact, website, engagement, and tags', async () => {
    renderProfile();
    await waitFor(() => screen.getByText('Grace Community Church'));
    expect(screen.getByText('A growing church seeking long-term partnerships.')).toBeInTheDocument();
    expect(screen.getByText('Unreached people groups in creative-access countries.')).toBeInTheDocument();
    expect(screen.getByText('Priya Nair, Global Outreach Director')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /gracecommunity\.example\.com/i })).toBeInTheDocument();
    expect(screen.getByText('Hosts short-term trips')).toBeInTheDocument();
    expect(screen.getByText('Hosts furloughs')).toBeInTheDocument();
    expect(screen.queryByText('Sends teams')).not.toBeInTheDocument();
    expect(screen.getByText("Believer's Baptism")).toBeInTheDocument();
    expect(screen.getByText('Dallas, TX')).toBeInTheDocument();
  });

  it('omits optional sections when their fields are empty', async () => {
    churchRow = { ...CHURCH, bio: null, missions_focus: null, contact_name: null, contact_role: null, website: null };
    renderProfile();
    await waitFor(() => screen.getByText('Grace Community Church'));
    expect(screen.queryByText('About')).not.toBeInTheDocument();
    expect(screen.queryByText('Current missions focus')).not.toBeInTheDocument();
    expect(screen.queryByText('Point of contact')).not.toBeInTheDocument();
    expect(screen.queryByText('Website')).not.toBeInTheDocument();
  });
});
