import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../../../supabaseClient.js';

interface MissionaryRow {
  id: string;
  name: string;
  name_note: string | null;
  location: string;
  lat: number;
  lng: number;
  role: string;
  ministry: string;
  prayer_count: number;
  support_goal: number;
  budget: unknown;
  prayer_requests: unknown;
  sensitive_count: number;
  updates: unknown;
  location_sensitive: boolean;
}

interface FormState {
  id: string;
  name: string;
  name_note: string;
  location: string;
  lat: string;
  lng: string;
  role: string;
  ministry: string;
  prayer_count: string;
  support_goal: string;
  sensitive_count: string;
  location_sensitive: boolean;
  budget: string;
  prayer_requests: string;
  updates: string;
}

const EMPTY_FORM: FormState = {
  id: '',
  name: '',
  name_note: '',
  location: '',
  lat: '',
  lng: '',
  role: '',
  ministry: '',
  prayer_count: '0',
  support_goal: '0',
  sensitive_count: '0',
  location_sensitive: false,
  budget: '[]',
  prayer_requests: '[]',
  updates: '[]'
};

function rowToForm(row: MissionaryRow): FormState {
  return {
    id: row.id,
    name: row.name,
    name_note: row.name_note ?? '',
    location: row.location,
    lat: String(row.lat),
    lng: String(row.lng),
    role: row.role,
    ministry: row.ministry,
    prayer_count: String(row.prayer_count),
    support_goal: String(row.support_goal),
    sensitive_count: String(row.sensitive_count),
    location_sensitive: row.location_sensitive,
    budget: JSON.stringify(row.budget, null, 2),
    prayer_requests: JSON.stringify(row.prayer_requests, null, 2),
    updates: JSON.stringify(row.updates, null, 2)
  };
}

/**
 * Missionary records (Stage 2 of REAL_AUTH_DESIGN.md) — the public,
 * non-confidential half of the prayer-map data (name/location/ministry/
 * budget/updates), previously hardcoded in data/missionaries.ts. Confidential
 * text is managed elsewhere entirely (missionary_sensitive_requests has no
 * admin UI yet — it's still seeded via SQL, same as before this feature).
 *
 * Scalar fields get real inputs; budget/prayer_requests/updates (arrays of
 * small objects — line items, requests, dated posts with a photo path) are
 * edited as raw JSON textareas rather than a nested form builder for each.
 * Simpler to build and maintain, and this admin is already comfortable
 * editing structured data directly (see the SQL steps used to bootstrap
 * this very account).
 */
export default function AdminMissionaries() {
  const [rows, setRows] = useState<MissionaryRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isNew, setIsNew] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('missionaries').select('*').order('name');
    if (error) {
      console.error('Failed to load missionaries:', error);
      setLoadError(true);
      return;
    }
    setLoadError(false);
    setRows((data as MissionaryRow[]) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setForm(EMPTY_FORM);
    setIsNew(true);
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(row: MissionaryRow) {
    setForm(rowToForm(row));
    setIsNew(false);
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setFormError(null);

    let budget: unknown;
    let prayerRequests: unknown;
    let updates: unknown;
    try {
      budget = JSON.parse(form.budget);
      prayerRequests = JSON.parse(form.prayer_requests);
      updates = JSON.parse(form.updates);
    } catch (err) {
      setFormError(`Budget, prayer requests, and updates must each be valid JSON: ${(err as Error).message}`);
      return;
    }

    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (!form.id.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
      setFormError('ID, latitude, and longitude are required (lat/lng must be numbers).');
      return;
    }

    setSaving(true);
    const payload = {
      id: form.id.trim(),
      name: form.name,
      name_note: form.name_note || null,
      location: form.location,
      lat,
      lng,
      role: form.role,
      ministry: form.ministry,
      prayer_count: Number(form.prayer_count) || 0,
      support_goal: Number(form.support_goal) || 0,
      sensitive_count: Number(form.sensitive_count) || 0,
      location_sensitive: form.location_sensitive,
      budget,
      prayer_requests: prayerRequests,
      updates
    };

    const { error } = isNew
      ? await supabase.from('missionaries').insert(payload)
      : await supabase.from('missionaries').update(payload).eq('id', form.id);
    setSaving(false);

    if (error) {
      setFormError(error.message);
      return;
    }
    setFormOpen(false);
    load();
  }

  async function handleDelete(id: string, name: string) {
    if (!supabase) return;
    if (!window.confirm(`Permanently delete ${name}? This can't be undone.`)) return;
    const { error } = await supabase.from('missionaries').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete missionary:', error);
      return;
    }
    load();
  }

  return (
    <div className="pm-admin-missionaries">
      <h2 className="pm-admin-subheading">Missionaries</h2>
      {loadError && (
        <p className="pm-login-error" role="alert">
          Couldn't load missionaries right now — try refreshing.
        </p>
      )}

      {!formOpen && (
        <button type="button" className="pm-admin-add-missionary" onClick={openNew}>
          Add missionary
        </button>
      )}

      {formOpen && (
        <form className="pm-admin-missionary-form" onSubmit={handleSubmit}>
          <h3>{isNew ? 'Add missionary' : `Edit ${form.name || form.id}`}</h3>

          <label>
            ID {!isNew && <span className="pm-admin-form-hint">(fixed once created)</span>}
            <input
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value })}
              disabled={!isNew}
              required
              placeholder="e.g. smith-burkina-faso"
            />
          </label>
          <label>
            Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>
            Name note (optional, e.g. "Names changed for security")
            <input value={form.name_note} onChange={(e) => setForm({ ...form, name_note: e.target.value })} />
          </label>
          <label>
            Location
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
          </label>
          <div className="pm-admin-form-row">
            <label>
              Latitude
              <input
                type="number"
                step="any"
                value={form.lat}
                onChange={(e) => setForm({ ...form, lat: e.target.value })}
                required
              />
            </label>
            <label>
              Longitude
              <input
                type="number"
                step="any"
                value={form.lng}
                onChange={(e) => setForm({ ...form, lng: e.target.value })}
                required
              />
            </label>
          </div>
          <label>
            Role
            <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required />
          </label>
          <label>
            Ministry overview
            <textarea
              value={form.ministry}
              onChange={(e) => setForm({ ...form, ministry: e.target.value })}
              rows={4}
              required
            />
          </label>
          <div className="pm-admin-form-row">
            <label>
              Prayer count
              <input
                type="number"
                value={form.prayer_count}
                onChange={(e) => setForm({ ...form, prayer_count: e.target.value })}
              />
            </label>
            <label>
              Support goal (%)
              <input
                type="number"
                value={form.support_goal}
                onChange={(e) => setForm({ ...form, support_goal: e.target.value })}
              />
            </label>
            <label>
              Sensitive request count
              <input
                type="number"
                value={form.sensitive_count}
                onChange={(e) => setForm({ ...form, sensitive_count: e.target.value })}
              />
            </label>
          </div>
          <label className="pm-admin-checkbox-label">
            <input
              type="checkbox"
              checked={form.location_sensitive}
              onChange={(e) => setForm({ ...form, location_sensitive: e.target.checked })}
            />
            Location-sensitive (creative access — map shows a soft area, not a pin)
          </label>

          <label>
            Budget (JSON array of {'{ item, purpose, amount }'})
            <textarea
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              rows={6}
              className="pm-admin-json-field"
            />
          </label>
          <label>
            Prayer requests (JSON array of {'{ text, type: "sticky"|"auto"|"urgent" }'})
            <textarea
              value={form.prayer_requests}
              onChange={(e) => setForm({ ...form, prayer_requests: e.target.value })}
              rows={4}
              className="pm-admin-json-field"
            />
          </label>
          <label>
            Updates (JSON array of {'{ date, title, text, photo, photoWidth, photoHeight }'})
            <textarea
              value={form.updates}
              onChange={(e) => setForm({ ...form, updates: e.target.value })}
              rows={6}
              className="pm-admin-json-field"
            />
          </label>

          {formError && (
            <p className="pm-login-error" role="alert">
              {formError}
            </p>
          )}

          <div className="pm-admin-form-actions">
            <button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isNew ? 'Add missionary' : 'Save changes'}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {rows === null ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <p>No missionaries yet.</p>
      ) : (
        <table className="pm-admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Role</th>
              <th>Support</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.location}</td>
                <td>{row.role}</td>
                <td>{row.support_goal}%</td>
                <td className="pm-admin-actions">
                  <button type="button" className="pm-admin-accept" onClick={() => openEdit(row)}>
                    Edit
                  </button>
                  <button type="button" className="pm-admin-delete" onClick={() => handleDelete(row.id, row.name)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
