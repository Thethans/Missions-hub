import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MissionaryHeadshotUpload from './MissionaryHeadshotUpload.jsx';

const USER = { id: 'user-1' };

let mockSupabase = null;
let uploadError = null;
let getUserError = null;
const uploadSpy = vi.fn();
const getPublicUrlSpy = vi.fn();

vi.mock('../supabaseClient.js', () => ({
  get supabase() {
    return mockSupabase;
  }
}));

function buildSupabaseMock() {
  return {
    auth: {
      getUser: () => Promise.resolve({ data: { user: getUserError ? null : USER }, error: getUserError })
    },
    storage: {
      from: (bucket) => ({
        upload: (path, file) => {
          uploadSpy(bucket, path, file);
          return Promise.resolve({ error: uploadError });
        },
        getPublicUrl: (path) => {
          getPublicUrlSpy(path);
          return { data: { publicUrl: `https://cdn.example.com/${path}` } };
        }
      })
    }
  };
}

describe('MissionaryHeadshotUpload', () => {
  beforeEach(() => {
    uploadError = null;
    getUserError = null;
    uploadSpy.mockClear();
    getPublicUrlSpy.mockClear();
    mockSupabase = buildSupabaseMock();
  });

  it('uploads to a path prefixed with the signed-in user id and reports the resulting URL', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MissionaryHeadshotUpload value="" onChange={onChange} />);

    const file = new File(['fake image bytes'], 'headshot.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/upload headshot photo/i), file);

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        expect.stringMatching(/^https:\/\/cdn\.example\.com\/user-1\/\d+-headshot\.jpg$/)
      )
    );
    expect(uploadSpy).toHaveBeenCalledWith('missionary-headshots', expect.stringMatching(/^user-1\/\d+-headshot\.jpg$/), file);
  });

  it('shows an error and does not call onChange when the upload fails', async () => {
    uploadError = { message: 'quota exceeded' };
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MissionaryHeadshotUpload value="" onChange={onChange} />);

    const file = new File(['fake image bytes'], 'headshot.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/upload headshot photo/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(/quota exceeded/i);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows an error and never uploads when the session has expired', async () => {
    getUserError = { message: 'Your session expired — please sign in again.' };
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MissionaryHeadshotUpload value="" onChange={onChange} />);

    const file = new File(['fake image bytes'], 'headshot.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/upload headshot photo/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(/session expired/i);
    expect(uploadSpy).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows a preview image when a value is already set', () => {
    const { container } = render(<MissionaryHeadshotUpload value="https://cdn.example.com/existing.jpg" onChange={vi.fn()} />);
    const preview = container.querySelector('img.onboarding-headshot-preview');
    expect(preview?.src).toBe('https://cdn.example.com/existing.jpg');
  });
});
