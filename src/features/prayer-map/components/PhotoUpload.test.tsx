import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhotoUpload from './PhotoUpload';

let mockSupabase: unknown = null;
let uploadError: { message: string } | null = null;
const uploadSpy = vi.fn();
const getPublicUrlSpy = vi.fn();

vi.mock('../../../supabaseClient.js', () => ({
  get supabase() {
    return mockSupabase;
  }
}));

function buildSupabaseMock() {
  return {
    storage: {
      from: (bucket: string) => ({
        upload: (path: string, file: File) => {
          uploadSpy(bucket, path, file);
          return Promise.resolve({ error: uploadError });
        },
        getPublicUrl: (path: string) => {
          getPublicUrlSpy(path);
          return { data: { publicUrl: `https://cdn.example.com/${path}` } };
        }
      })
    }
  };
}

// jsdom doesn't implement image decoding or createObjectURL — PhotoUpload
// reads real pixel dimensions via `new Image()` + onload, so both need a
// stand-in that resolves synchronously-ish with a known size.
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 800;
  naturalHeight = 600;
  set src(_value: string) {
    setTimeout(() => this.onload?.(), 0);
  }
}

describe('PhotoUpload', () => {
  beforeEach(() => {
    uploadError = null;
    uploadSpy.mockClear();
    getPublicUrlSpy.mockClear();
    mockSupabase = buildSupabaseMock();
    vi.stubGlobal('Image', MockImage);
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uploads the file, reads its dimensions, and reports the resulting URL', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PhotoUpload value="" onChange={onChange} />);

    const file = new File(['fake image bytes'], 'photo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/upload photo/i);
    await user.upload(input, file);

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/cdn\.example\.com\/\d+-photo\.jpg$/), 800, 600)
    );
    expect(uploadSpy).toHaveBeenCalledWith('missionary-photos', expect.stringMatching(/^\d+-photo\.jpg$/), file);
  });

  it('shows an error and does not call onChange when the upload fails', async () => {
    uploadError = { message: 'quota exceeded' };
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PhotoUpload value="" onChange={onChange} />);

    const file = new File(['fake image bytes'], 'photo.jpg', { type: 'image/jpeg' });
    await user.upload(screen.getByLabelText(/upload photo/i), file);

    expect(await screen.findByRole('alert')).toHaveTextContent(/quota exceeded/i);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows a preview image when a value is already set', () => {
    const { container } = render(<PhotoUpload value="https://cdn.example.com/existing.jpg" onChange={vi.fn()} />);
    const preview = container.querySelector('img.pm-admin-photo-preview') as HTMLImageElement | null;
    expect(preview?.src).toBe('https://cdn.example.com/existing.jpg');
  });
});
