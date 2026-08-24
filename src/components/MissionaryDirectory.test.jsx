import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MissionaryDirectory from './MissionaryDirectory.jsx';

function renderDirectory() {
  return render(
    <MemoryRouter>
      <MissionaryDirectory />
    </MemoryRouter>
  );
}

const TAGS = [
  { id: 'credobaptist', label: "Believer's Baptism", category: 'baptism' },
  { id: 'complementarian', label: 'Complementarian', category: 'gender_roles' }
];

const PUBLIC_MISSIONARY = {
  id: 'm-1',
  display_name: 'Jane Doe',
  agency_name: 'Agency X',
  field_region: 'West Africa',
  field_visibility: 'region_only',
  verification: 'agency_verified',
  bio: 'Serving in West Africa.',
  support_raised_pct: 62,
  missionary_doctrinal_tags: [{ doctrinal_tags: { id: 'credobaptist', label: "Believer's Baptism" } }]
};

const PRIVATE_MISSIONARY = {
  id: 'm-2',
  display_name: 'John Smith',
  agency_name: null,
  field_region: 'South Asia',
  field_visibility: 'private',
  verification: 'self_reported',
  bio: null,
  support_raised_pct: null,
  missionary_doctrinal_tags: []
};

let missionaryRows;

function makeSupabaseMock() {
  return {
    from: vi.fn((table) => {
      if (table === 'doctrinal_tags') {
        return { select: () => ({ order: () => ({ order: () => Promise.resolve({ data: TAGS, error: null }) }) }) };
      }
      if (table === 'missionary_profiles') {
        return {
          select: () => ({
            eq: () => ({ order: () => Promise.resolve({ data: missionaryRows, error: null }) })
          })
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
  missionaryRows = [PUBLIC_MISSIONARY, PRIVATE_MISSIONARY];
  mockSupabase = makeSupabaseMock();
});

describe('MissionaryDirectory', () => {
  it('renders approved missionaries with verification badge and support progress', async () => {
    renderDirectory();
    await waitFor(() => screen.getByText('Jane Doe'));
    expect(screen.getByText('Agency-verified')).toBeInTheDocument();
    expect(
      screen.getByText((_, el) => el?.tagName === 'SPAN' && el.textContent.trim() === 'West Africa')
    ).toBeInTheDocument();
    expect(screen.getByText('62% of support raised')).toBeInTheDocument();
  });

  it('shows initials instead of a photo when a missionary has no headshot_url', async () => {
    renderDirectory();
    await waitFor(() => screen.getByText('Jane Doe'));
    const card = screen.getByText('Jane Doe').closest('.directory-card');
    expect(card.querySelector('img')).not.toBeInTheDocument();
    expect(card.querySelector('.directory-card-avatar--initials')).toHaveTextContent('JD');
  });

  it('renders the headshot photo when headshot_url is set', async () => {
    missionaryRows = [{ ...PUBLIC_MISSIONARY, headshot_url: 'https://cdn.example.com/jane.jpg' }, PRIVATE_MISSIONARY];
    mockSupabase = makeSupabaseMock();
    renderDirectory();
    await waitFor(() => screen.getByText('Jane Doe'));
    const card = screen.getByText('Jane Doe').closest('.directory-card');
    const img = card.querySelector('img.directory-card-avatar');
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/jane.jpg');
  });

  it('shows "Location available on request" instead of the region for a private-visibility profile', async () => {
    renderDirectory();
    await waitFor(() => screen.getByText('John Smith'));
    expect(screen.getByText('Location available on request')).toBeInTheDocument();
    expect(screen.queryByText('South Asia')).not.toBeInTheDocument();
  });

  it('excludes private-visibility profiles from the region filter options', async () => {
    renderDirectory();
    await waitFor(() => screen.getByText('Jane Doe'));
    const regionSelect = screen.getByLabelText(/field region/i);
    const optionValues = [...regionSelect.querySelectorAll('option')].map((o) => o.value);
    expect(optionValues).toContain('West Africa');
    expect(optionValues).not.toContain('South Asia');
  });

  it('filters by doctrinal tag', async () => {
    const user = userEvent.setup();
    renderDirectory();
    await waitFor(() => screen.getByText('Jane Doe'));

    await user.click(screen.getByLabelText('Complementarian'));
    await waitFor(() => screen.getByText(/no missionary profiles match/i));
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /clear filters/i })[0]);
    await waitFor(() => screen.getByText('Jane Doe'));
  });
});
