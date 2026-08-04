import React, { useEffect, useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { supabase } from '../supabaseClient.js';
import { CATEGORY_LABELS, groupTagsByCategory } from '../data/doctrinalTagCategories.js';

const GIVING_CAPACITY_OPTIONS = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' }
];

const INITIAL_FORM = {
  church_name: '',
  city: '',
  state: '',
  denomination: '',
  giving_capacity_tier: ''
};

// Mirrors MissionaryOnboardingForm.jsx's structure (see that file for the
// reasoning behind the getUser()-at-submit-time pattern and the graceful
// tags-insert-failure handling) — church_profiles is the church-side
// equivalent of missionary_profiles.
export default function ChurchOnboardingForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [tags, setTags] = useState(null); // null = loading
  const [tagsError, setTagsError] = useState(null);
  const [selectedTagIds, setSelectedTagIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [tagsSaveWarning, setTagsSaveWarning] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from('doctrinal_tags')
      .select('*')
      .order('category')
      .order('label')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setTagsError(error.message);
          return;
        }
        setTags(data || []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleTag(tagId) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setTagsSaveWarning(null);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setSubmitting(false);
      setSubmitError(userError?.message || 'Your session expired — please sign in again.');
      return;
    }

    // status is deliberately omitted — the DB defaults it to pending_review
    // and a trigger blocks any later attempt by this same user to change it
    // (see supabase/schema.sql).
    const { error: insertError } = await supabase.from('church_profiles').insert({
      id: user.id,
      church_name: form.church_name,
      city: form.city || null,
      state: form.state || null,
      denomination: form.denomination || null,
      giving_capacity_tier: form.giving_capacity_tier || null
    });

    if (insertError) {
      setSubmitting(false);
      setSubmitError(insertError.message);
      return;
    }

    if (selectedTagIds.size > 0) {
      const { error: tagsInsertError } = await supabase
        .from('church_doctrinal_tags')
        .insert([...selectedTagIds].map((tagId) => ({ church_id: user.id, tag_id: tagId })));
      if (tagsInsertError) {
        setTagsSaveWarning(
          "Your profile was saved, but your doctrinal tags couldn't be — you can add them later from your dashboard."
        );
      }
    }

    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="onboarding-auth onboarding-confirmation">
        <CheckCircle weight="bold" size={28} />
        <h2>Thanks — your profile is under review.</h2>
        <p>
          It won't be able to request introductions yet. We'll let you know once it's approved.
        </p>
        {tagsSaveWarning && (
          <p className="onboarding-warning" role="alert">{tagsSaveWarning}</p>
        )}
      </div>
    );
  }

  return (
    <form className="onboarding-form" onSubmit={handleSubmit}>
      <h2>Your church profile</h2>
      <p className="onboarding-form-intro">
        This goes to review before you can request introductions to any missionary — nothing here
        is public yet.
      </p>

      <label>
        Church name
        <input
          type="text"
          required
          value={form.church_name}
          onChange={(e) => updateField('church_name', e.target.value)}
        />
      </label>

      <div className="onboarding-form-row">
        <label>
          City
          <input
            type="text"
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
          />
        </label>
        <label>
          State
          <input
            type="text"
            value={form.state}
            onChange={(e) => updateField('state', e.target.value)}
          />
        </label>
      </div>

      <label>
        Denomination
        <input
          type="text"
          value={form.denomination}
          onChange={(e) => updateField('denomination', e.target.value)}
        />
      </label>

      <label>
        Giving capacity
        <select
          value={form.giving_capacity_tier}
          onChange={(e) => updateField('giving_capacity_tier', e.target.value)}
        >
          <option value="" disabled>Select a giving capacity…</option>
          {GIVING_CAPACITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      {tagsError && (
        <p className="onboarding-error" role="alert">
          Couldn't load doctrinal tags right now — you can skip this and add them later.
        </p>
      )}
      {tags === null && !tagsError && (
        <p className="onboarding-loading" role="status">Loading doctrinal tags…</p>
      )}
      {tags && tags.length > 0 && (
        <div className="onboarding-tags">
          <h3>Doctrinal positions</h3>
          {[...groupTagsByCategory(tags)].map(([category, categoryTags]) => (
            <fieldset className="onboarding-tag-group" key={category}>
              <legend>{CATEGORY_LABELS[category] || category}</legend>
              {categoryTags.map((tag) => (
                <label key={tag.id} className="onboarding-tag-option">
                  <input
                    type="checkbox"
                    checked={selectedTagIds.has(tag.id)}
                    onChange={() => toggleTag(tag.id)}
                  />
                  {' '}{tag.label}
                </label>
              ))}
            </fieldset>
          ))}
        </div>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit for review'}
      </button>
      {submitError && <p className="onboarding-error" role="alert">{submitError}</p>}
    </form>
  );
}
