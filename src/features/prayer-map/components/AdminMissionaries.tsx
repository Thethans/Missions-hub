import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../../../supabaseClient.js';
import type { BudgetLine, MissionaryUpdate, PrayerRequest, PrayerRequestType } from '../data/types';
import PhotoUpload from './PhotoUpload';

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
  budget: BudgetLine[];
  prayer_requests: PrayerRequest[];
  sensitive_count: number;
  updates: MissionaryUpdate[];
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
  budget: BudgetLine[];
  prayer_requests: PrayerRequest[];
  updates: MissionaryUpdate[];
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
  budget: [],
  prayer_requests: [],
  updates: []
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
    budget: row.budget,
    prayer_requests: row.prayer_requests,
    updates: row.updates
  };
}

const PRAYER_REQUEST_TYPES: PrayerRequestType[] = ['sticky', 'auto', 'urgent'];

function BudgetEditor({ value, onChange }: { value: BudgetLine[]; onChange: (v: BudgetLine[]) => void }) {
  const update = (i: number, patch: Partial<BudgetLine>) =>
    onChange(value.map((line, idx) => (idx === i ? { ...line, ...patch } : line)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { item: '', purpose: '', amount: 0 }]);

  return (
    <div className="pm-admin-list-editor">
      <span className="pm-admin-list-editor-label">Budget line items</span>
      {value.map((line, i) => (
        <div className="pm-admin-list-row" key={i}>
          <input
            placeholder="Item (e.g. Housing & utilities)"
            value={line.item}
            onChange={(e) => update(i, { item: e.target.value })}
            aria-label={`Budget item ${i + 1} name`}
          />
          <input
            placeholder="Purpose"
            value={line.purpose}
            onChange={(e) => update(i, { purpose: e.target.value })}
            aria-label={`Budget item ${i + 1} purpose`}
          />
          <input
            type="number"
            placeholder="Amount"
            value={line.amount}
            onChange={(e) => update(i, { amount: Number(e.target.value) || 0 })}
            aria-label={`Budget item ${i + 1} monthly amount`}
            className="pm-admin-list-amount"
          />
          <button type="button" className="pm-admin-list-remove" onClick={() => remove(i)} aria-label={`Remove ${line.item || 'this budget line'}`}>
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="pm-admin-list-add" onClick={add}>
        + Add budget line
      </button>
    </div>
  );
}

function PrayerRequestEditor({ value, onChange }: { value: PrayerRequest[]; onChange: (v: PrayerRequest[]) => void }) {
  const update = (i: number, patch: Partial<PrayerRequest>) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { text: '', type: 'sticky' }]);

  return (
    <div className="pm-admin-list-editor">
      <span className="pm-admin-list-editor-label">Prayer requests</span>
      {value.map((r, i) => (
        <div className="pm-admin-list-row" key={i}>
          <input
            placeholder="Request text"
            value={r.text}
            onChange={(e) => update(i, { text: e.target.value })}
            aria-label={`Prayer request ${i + 1} text`}
            className="pm-admin-list-grow"
          />
          <select
            value={r.type}
            onChange={(e) => update(i, { type: e.target.value as PrayerRequestType })}
            aria-label={`Prayer request ${i + 1} type`}
          >
            {PRAYER_REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button type="button" className="pm-admin-list-remove" onClick={() => remove(i)} aria-label="Remove this prayer request">
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="pm-admin-list-add" onClick={add}>
        + Add prayer request
      </button>
    </div>
  );
}

function UpdateEditor({ value, onChange }: { value: MissionaryUpdate[]; onChange: (v: MissionaryUpdate[]) => void }) {
  const update = (i: number, patch: Partial<MissionaryUpdate>) =>
    onChange(value.map((u, idx) => (idx === i ? { ...u, ...patch } : u)));
  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const add = () => onChange([...value, { date: '', title: '', text: '', photo: '', photoWidth: 0, photoHeight: 0 }]);

  return (
    <div className="pm-admin-list-editor">
      <span className="pm-admin-list-editor-label">Updates</span>
      {value.map((u, i) => (
        <div className="pm-admin-update-row" key={i}>
          <div className="pm-admin-list-row">
            <input
              placeholder="Date (e.g. 2 days ago)"
              value={u.date}
              onChange={(e) => update(i, { date: e.target.value })}
              aria-label={`Update ${i + 1} date`}
            />
            <input
              placeholder="Title"
              value={u.title}
              onChange={(e) => update(i, { title: e.target.value })}
              aria-label={`Update ${i + 1} title`}
              className="pm-admin-list-grow"
            />
            <button type="button" className="pm-admin-list-remove" onClick={() => remove(i)} aria-label={`Remove update: ${u.title || 'untitled'}`}>
              ✕
            </button>
          </div>
          <textarea
            placeholder="Update text"
            value={u.text}
            onChange={(e) => update(i, { text: e.target.value })}
            rows={3}
            aria-label={`Update ${i + 1} text`}
          />
          <PhotoUpload
            value={u.photo}
            onChange={(photo, photoWidth, photoHeight) => update(i, { photo, photoWidth, photoHeight })}
          />
        </div>
      ))}
      <button type="button" className="pm-admin-list-add" onClick={add}>
        + Add update
      </button>
    </div>
  );
}

/**
 * Missionary records (Stage 2 of REAL_AUTH_DESIGN.md) — the public,
 * non-confidential half of the prayer-map data (name/location/ministry/
 * budget/updates), previously hardcoded in data/missionaries.ts. Confidential
 * text is managed elsewhere entirely (missionary_sensitive_requests has no
 * admin UI yet — it's still seeded via SQL, same as before this feature).
 *
 * Budget/prayer requests/updates are structured repeatable field groups
 * (BudgetEditor/PrayerRequestEditor/UpdateEditor above), not raw JSON —
 * a stray comma in hand-edited JSON used to silently break the save with
 * no field-level guidance. Update photos upload directly to Supabase
 * Storage via PhotoUpload rather than requiring an admin to already have
 * a hosted URL.
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
      budget: form.budget,
      prayer_requests: form.prayer_requests,
      updates: form.updates
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

          <BudgetEditor value={form.budget} onChange={(budget) => setForm({ ...form, budget })} />
          <PrayerRequestEditor value={form.prayer_requests} onChange={(prayer_requests) => setForm({ ...form, prayer_requests })} />
          <UpdateEditor value={form.updates} onChange={(updates) => setForm({ ...form, updates })} />

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
