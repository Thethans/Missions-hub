import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ChurchDirectory from './ChurchDirectory.jsx';

function renderDirectory() {
  return render(
    <MemoryRouter>
      <ChurchDirectory />
    </MemoryRouter>
  );
}

const TAGS = [
  { id: 'credobaptist', label: "Believer's Baptism", category: 'baptism' },
  { id: 'complementarian', label: 'Complementarian', category: 'gender_roles' }
];

const CHURCH_WITH_WEBSITE = {
  id: 'c-1',
  church_name: 'Grace Community Church',
  city: 'Dallas',
  state: 'TX',
  denomination: 'Non-denominational',
  website: 'https://gracecommunity.example.com',
  church_doctrinal_tags: [{ doctrinal_tags: { id: 'credobaptist', label: "Believer's Baptism" } }]
};

const CHURCH_NO_WEBSITE = {
  id: 'c-2',
  church_name: 'First Baptist Church',
  city: null,
  state: 'OK',
  denomination: null,
  website: null,
  church_doctrinal_tags: []
};

let churchRows;

function makeSupabaseMock() {
  return {
    from: vi.fn((table) => {
      if (table === 'doctrinal_tags') {
        return { select: () => ({ order: () => ({ order: () => Promise.resolve({ data: TAGS, error: null }) }) }) };
      }
      if (table === 'church_profiles') {
        return {
          select: () => ({
            eq: () => ({ order: () => Promise.resolve({ data: churchRows, error: null }) })
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
  churchRows = [CHURCH_WITH_WEBSITE, CHURCH_NO_WEBSITE];
  mockSupabase = makeSupabaseMock();
});

describe('ChurchDirectory', () => {
  it('renders approved churches with denomination, location, and website link', async () => {
    renderDirectory();
    await waitFor(() => screen.getByText('Grace Community Church'));
    expect(screen.getByText('Non-denominational')).toBeInTheDocument();
    expect(screen.getByText('Dallas, TX')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /gracecommunity\.example\.com/i });
    expect(link).toHaveAttribute('href', 'https://gracecommunity.example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('falls back to state alone and omits the website link when a church has neither city nor a site', async () => {
    renderDirectory();
    await waitFor(() => screen.getByText('First Baptist Church'));
    const card = screen.getByText('First Baptist Church').closest('article');
    expect(
      within(card).getByText((_, el) => el?.tagName === 'SPAN' && el.textContent.trim() === 'OK')
    ).toBeInTheDocument();
    expect(within(card).queryByRole('link')).not.toBeInTheDocument();
  });

  it('excludes states with no churches from the state filter, includes ones that have one', async () => {
    renderDirectory();
    await waitFor(() => screen.getByText('Grace Community Church'));
    const stateSelect = screen.getByLabelText(/state/i);
    const optionValues = [...stateSelect.querySelectorAll('option')].map((o) => o.value);
    expect(optionValues).toContain('TX');
    expect(optionValues).toContain('OK');
  });

  it('filters by doctrinal tag', async () => {
    const user = userEvent.setup();
    renderDirectory();
    await waitFor(() => screen.getByText('Grace Community Church'));

    await user.click(screen.getByLabelText('Complementarian'));
    await waitFor(() => screen.getByText(/no church profiles match/i));
    expect(screen.queryByText('Grace Community Church')).not.toBeInTheDocument();

    await user.click(screen.getAllByRole('button', { name: /clear filters/i })[0]);
    await waitFor(() => screen.getByText('Grace Community Church'));
  });
});
