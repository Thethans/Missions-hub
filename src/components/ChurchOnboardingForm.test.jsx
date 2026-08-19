import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChurchOnboardingForm from './ChurchOnboardingForm.jsx';

const TAGS = [
  { id: 'credobaptist', label: "Believer's Baptism", category: 'baptism' },
  { id: 'paedobaptist', label: 'Infant Baptism', category: 'baptism' },
  { id: 'complementarian', label: 'Complementarian', category: 'gender_roles' }
];

const USER = { id: 'church-user-1' };

let insertProfile;
let insertTags;
let profileInsertError = null;
let tagsInsertError = null;

function makeSupabaseMock() {
  insertProfile = vi.fn(() => Promise.resolve({ error: profileInsertError }));
  insertTags = vi.fn(() => Promise.resolve({ error: tagsInsertError }));

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: USER }, error: null })
    },
    from: vi.fn((table) => {
      if (table === 'doctrinal_tags') {
        return { select: () => ({ order: () => ({ order: () => Promise.resolve({ data: TAGS, error: null }) }) }) };
      }
      if (table === 'church_profiles') {
        return { insert: insertProfile };
      }
      if (table === 'church_doctrinal_tags') {
        return { insert: insertTags };
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
  profileInsertError = null;
  tagsInsertError = null;
  mockSupabase = makeSupabaseMock();
});

async function fillRequiredFields(user) {
  await user.type(screen.getByLabelText(/church name/i), 'First Church');
}

describe('ChurchOnboardingForm', () => {
  it('loads doctrinal tags grouped by category', async () => {
    render(<ChurchOnboardingForm />);
    await waitFor(() => screen.getByText('Baptism'));
    expect(screen.getByText('Gender Roles')).toBeInTheDocument();
    expect(screen.getByLabelText("Believer's Baptism")).toBeInTheDocument();
  });

  it('submits the profile without a status field, plus selected tags, then shows the review-pending confirmation', async () => {
    const user = userEvent.setup();
    render(<ChurchOnboardingForm />);
    await waitFor(() => screen.getByText('Baptism'));

    await fillRequiredFields(user);
    await user.selectOptions(screen.getByLabelText(/giving capacity/i), 'medium');
    await user.click(screen.getByLabelText("Believer's Baptism"));
    await user.click(screen.getByRole('button', { name: /submit for review/i }));

    await waitFor(() => expect(insertProfile).toHaveBeenCalled());
    const profilePayload = insertProfile.mock.calls[0][0];
    expect(profilePayload).toMatchObject({ id: 'church-user-1', church_name: 'First Church', giving_capacity_tier: 'medium' });
    expect(profilePayload).not.toHaveProperty('status');

    expect(insertTags).toHaveBeenCalledWith([{ church_id: 'church-user-1', tag_id: 'credobaptist' }]);

    await waitFor(() => screen.getByText(/under review/i));
    expect(screen.getByText(/request introductions yet/i)).toBeInTheDocument();
  });

  it('submits bio, missions focus, contact info, and engagement checkboxes', async () => {
    const user = userEvent.setup();
    render(<ChurchOnboardingForm />);
    await waitFor(() => screen.getByText('Baptism'));

    await fillRequiredFields(user);
    await user.type(screen.getByLabelText(/about your church/i), 'A congregation that loves missions.');
    await user.type(screen.getByLabelText(/current missions focus/i), 'East Asia church planting.');
    await user.type(screen.getByLabelText(/point of contact/i), 'Jamie Lee');
    await user.type(screen.getByLabelText(/their role/i), 'Missions Pastor');
    await user.click(screen.getByLabelText(/hosts short-term trips/i));
    await user.click(screen.getByLabelText(/sends teams/i));
    await user.click(screen.getByRole('button', { name: /submit for review/i }));

    await waitFor(() => expect(insertProfile).toHaveBeenCalled());
    expect(insertProfile.mock.calls[0][0]).toMatchObject({
      bio: 'A congregation that loves missions.',
      missions_focus: 'East Asia church planting.',
      contact_name: 'Jamie Lee',
      contact_role: 'Missions Pastor',
      hosts_short_term_trips: true,
      sends_teams: true,
      hosts_furloughs: false
    });
  });

  it('shows an error and does not confirm if the profile insert fails', async () => {
    profileInsertError = { message: 'duplicate key value violates unique constraint' };
    const user = userEvent.setup();
    render(<ChurchOnboardingForm />);
    await waitFor(() => screen.getByText('Baptism'));

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: /submit for review/i }));

    await waitFor(() => screen.getByRole('alert'));
    expect(screen.getByRole('alert')).toHaveTextContent(/duplicate key/i);
    expect(screen.queryByText(/under review/i)).not.toBeInTheDocument();
  });

  it('saves the profile but warns if the tags insert fails', async () => {
    tagsInsertError = { message: 'insert failed' };
    const user = userEvent.setup();
    render(<ChurchOnboardingForm />);
    await waitFor(() => screen.getByText('Baptism'));

    await fillRequiredFields(user);
    await user.click(screen.getByLabelText("Believer's Baptism"));
    await user.click(screen.getByRole('button', { name: /submit for review/i }));

    await waitFor(() => screen.getByText(/under review/i));
    expect(screen.getByText(/doctrinal tags couldn't be/i)).toBeInTheDocument();
  });
});
