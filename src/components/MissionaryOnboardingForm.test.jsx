import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MissionaryOnboardingForm from './MissionaryOnboardingForm.jsx';

const TAGS = [
  { id: 'credobaptist', label: "Believer's Baptism", category: 'baptism' },
  { id: 'paedobaptist', label: 'Infant Baptism', category: 'baptism' },
  { id: 'complementarian', label: 'Complementarian', category: 'gender_roles' }
];

const USER = { id: 'user-1' };

let insertProfile;
let insertTags;
let updateProfile;
let deleteTags;
let profileInsertError = null;
let tagsInsertError = null;
let profileUpdateError = null;
let tagsDeleteError = null;

function makeSupabaseMock() {
  insertProfile = vi.fn(() => Promise.resolve({ error: profileInsertError }));
  insertTags = vi.fn(() => Promise.resolve({ error: tagsInsertError }));
  updateProfile = vi.fn(() => ({ eq: () => Promise.resolve({ error: profileUpdateError }) }));
  deleteTags = vi.fn(() => ({ eq: () => Promise.resolve({ error: tagsDeleteError }) }));

  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: USER }, error: null })
    },
    from: vi.fn((table) => {
      if (table === 'doctrinal_tags') {
        return { select: () => ({ order: () => ({ order: () => Promise.resolve({ data: TAGS, error: null }) }) }) };
      }
      if (table === 'missionary_profiles') {
        return { insert: insertProfile, update: updateProfile };
      }
      if (table === 'missionary_doctrinal_tags') {
        return { insert: insertTags, delete: deleteTags };
      }
      throw new Error(`Unexpected table: ${table}`);
    }),
    // Backs MissionaryHeadshotUpload, embedded in this form — see its own
    // test file for upload-failure/session-expiry coverage; this mock only
    // needs the happy path to prove headshot_url round-trips into the
    // profile payload below.
    storage: {
      from: (bucket) => ({
        upload: () => Promise.resolve({ error: null }),
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.example.com/${bucket}/${path}` } })
      })
    }
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
  profileUpdateError = null;
  tagsDeleteError = null;
  mockSupabase = makeSupabaseMock();
});

async function fillRequiredFields(user) {
  await user.type(screen.getByLabelText(/display name/i), 'Jane Doe');
}

describe('MissionaryOnboardingForm', () => {
  it('loads doctrinal tags grouped by category', async () => {
    render(<MissionaryOnboardingForm />);
    await waitFor(() => screen.getByText('Baptism'));
    expect(screen.getByText('Gender Roles')).toBeInTheDocument();
    expect(screen.getByLabelText("Believer's Baptism")).toBeInTheDocument();
  });

  it('submits the profile without a status field, plus selected tags, then shows the review-pending confirmation', async () => {
    const user = userEvent.setup();
    render(<MissionaryOnboardingForm />);
    await waitFor(() => screen.getByText('Baptism'));

    await fillRequiredFields(user);
    await user.click(screen.getByLabelText("Believer's Baptism"));
    await user.click(screen.getByRole('button', { name: /submit for review/i }));

    await waitFor(() => expect(insertProfile).toHaveBeenCalled());
    const profilePayload = insertProfile.mock.calls[0][0];
    expect(profilePayload).toMatchObject({ id: 'user-1', display_name: 'Jane Doe', field_visibility: 'region_only' });
    expect(profilePayload).not.toHaveProperty('status');
    expect(profilePayload).not.toHaveProperty('verification');

    expect(insertTags).toHaveBeenCalledWith([{ missionary_id: 'user-1', tag_id: 'credobaptist' }]);

    await waitFor(() => screen.getByText(/under review/i));
    expect(screen.getByText(/won't show up in the church directory yet/i)).toBeInTheDocument();
  });

  it('uploads a headshot and includes its URL in the submit payload', async () => {
    const user = userEvent.setup();
    render(<MissionaryOnboardingForm />);
    await waitFor(() => screen.getByText('Baptism'));

    await fillRequiredFields(user);
    const file = new File(['fake image bytes'], 'headshot.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/upload headshot photo/i), file);
    await waitFor(() => screen.getByAltText(''));

    await user.click(screen.getByRole('button', { name: /submit for review/i }));

    await waitFor(() => expect(insertProfile).toHaveBeenCalled());
    expect(insertProfile.mock.calls[0][0]).toMatchObject({
      headshot_url: expect.stringMatching(/^https:\/\/cdn\.example\.com\/missionary-headshots\/user-1\/\d+-headshot\.jpg$/)
    });
  });

  it('shows an error and does not confirm if the profile insert fails', async () => {
    profileInsertError = { message: 'duplicate key value violates unique constraint' };
    const user = userEvent.setup();
    render(<MissionaryOnboardingForm />);
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
    render(<MissionaryOnboardingForm />);
    await waitFor(() => screen.getByText('Baptism'));

    await fillRequiredFields(user);
    await user.click(screen.getByLabelText("Believer's Baptism"));
    await user.click(screen.getByRole('button', { name: /submit for review/i }));

    await waitFor(() => screen.getByText(/under review/i));
    expect(screen.getByText(/doctrinal tags couldn't be/i)).toBeInTheDocument();
  });

  describe('edit mode (initial prop, as used by MissionaryDashboard)', () => {
    const EXISTING_PROFILE = {
      display_name: 'Jane Doe',
      agency_name: 'Agency X',
      field_region: 'West Africa',
      field_visibility: 'private',
      home_base_city: 'Springfield',
      home_base_state: 'IL',
      support_target_monthly: 4000,
      support_raised_pct: 40,
      family_size: 3,
      bio: 'Existing bio.'
    };

    it('pre-fills the form from `initial` and updates instead of inserting on save', async () => {
      const onSaved = vi.fn();
      const user = userEvent.setup();
      render(
        <MissionaryOnboardingForm
          initial={{ profile: EXISTING_PROFILE, tagIds: ['credobaptist'] }}
          onSaved={onSaved}
        />
      );
      await waitFor(() => screen.getByText('Baptism'));

      expect(screen.getByLabelText(/display name/i)).toHaveValue('Jane Doe');
      expect(screen.getByLabelText("Believer's Baptism")).toBeChecked();
      expect(screen.getByLabelText('Infant Baptism')).not.toBeChecked();

      await user.click(screen.getByRole('button', { name: /save changes/i }));

      await waitFor(() => expect(updateProfile).toHaveBeenCalled());
      const updatePayload = updateProfile.mock.calls[0][0];
      expect(updatePayload).toMatchObject({ display_name: 'Jane Doe', field_visibility: 'private' });
      expect(updatePayload).not.toHaveProperty('status');
      expect(updatePayload).not.toHaveProperty('verification');
      expect(insertProfile).not.toHaveBeenCalled();

      await waitFor(() => expect(deleteTags).toHaveBeenCalled());
      await waitFor(() => expect(insertTags).toHaveBeenCalledWith([{ missionary_id: 'user-1', tag_id: 'credobaptist' }]));

      await waitFor(() => expect(onSaved).toHaveBeenCalled());
      // Edit mode never shows the create-flow's "under review" confirmation.
      expect(screen.queryByText(/under review/i)).not.toBeInTheDocument();
    });

    it('calls onCancel when Cancel is clicked, without saving', async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(
        <MissionaryOnboardingForm
          initial={{ profile: EXISTING_PROFILE, tagIds: [] }}
          onSaved={vi.fn()}
          onCancel={onCancel}
        />
      );
      await waitFor(() => screen.getByText('Baptism'));

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(onCancel).toHaveBeenCalled();
      expect(updateProfile).not.toHaveBeenCalled();
    });
  });
});
