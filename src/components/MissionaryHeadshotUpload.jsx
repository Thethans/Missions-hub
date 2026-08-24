import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';

// Uploads to the public missionary-headshots Storage bucket (see
// schema.sql) — unlike prayer-map's PhotoUpload.tsx (admin-only writes to
// missionary-photos), this bucket's RLS only accepts a write whose object
// path is prefixed with the uploader's own auth.uid(), so the file must be
// saved as `${user.id}/...` rather than a flat root-level name. That's why
// this fetches the current user itself instead of trusting a passed-in id —
// the path has to be built from the same id the RLS check will compare
// against at write time.
export default function MissionaryHeadshotUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !supabase) return;

    setError(null);
    setUploading(true);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setUploading(false);
      setError(userError?.message || 'Your session expired — please sign in again.');
      return;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `${user.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from('missionary-headshots').upload(path, file);
    setUploading(false);

    if (uploadError) {
      setError(uploadError.message);
      return;
    }

    const { data } = supabase.storage.from('missionary-headshots').getPublicUrl(path);
    onChange(data.publicUrl);
  }

  return (
    <div className="onboarding-headshot-upload">
      {value && <img src={value} alt="" className="onboarding-headshot-preview" />}
      <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} aria-label="Upload headshot photo" />
      {uploading && (
        <span className="onboarding-headshot-status" role="status">
          Uploading…
        </span>
      )}
      {error && (
        <p className="onboarding-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
