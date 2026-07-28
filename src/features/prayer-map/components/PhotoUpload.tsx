import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { supabase } from '../../../supabaseClient.js';

interface PhotoUploadProps {
  value: string;
  onChange: (photo: string, width: number, height: number) => void;
}

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this file as an image.'));
    };
    img.src = url;
  });
}

/**
 * Uploads directly to the public missionary-photos Storage bucket (see
 * schema.sql) — RLS there only accepts writes from an active admin, same
 * boundary as every other admin write in this feature. Reads the file's
 * real pixel dimensions client-side before upload, since MissionaryUpdate
 * needs photoWidth/photoHeight to reserve layout space (avoids CLS) —
 * same fields the old bundled-asset imports carried, just measured here
 * instead of known at build time.
 */
export default function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !supabase) return;

    setError(null);
    setUploading(true);

    let dims: { width: number; height: number };
    try {
      dims = await readImageDimensions(file);
    } catch (err) {
      setError((err as Error).message);
      setUploading(false);
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('missionary-photos').upload(path, file);
    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('missionary-photos').getPublicUrl(path);
    onChange(data.publicUrl, dims.width, dims.height);
  }

  return (
    <div className="pm-admin-photo-upload">
      {value && <img src={value} alt="" className="pm-admin-photo-preview" />}
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} aria-label="Upload photo" />
      {uploading && (
        <span className="pm-admin-photo-status" role="status">
          Uploading…
        </span>
      )}
      {error && (
        <p className="pm-login-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
