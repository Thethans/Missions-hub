import React, { useEffect, useState } from 'react';
import { CheckCircle } from '@phosphor-icons/react';
import { supabase } from '../supabaseClient.js';
import { CATEGORY_LABELS, groupTagsByCategory } from '../data/doctrinalTagCategories.js';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public — show my exact region' },
  { value: 'region_only', label: 'Region only — general area, not exact location' },
  { value: 'private', label: "Private — don't show my location" }
];

const INITIAL_FORM = {
  display_name: '',
  agency_name: '',
  field_region: '',
  field_visibility: 'region_only',
  home_base_city: '',
  home_base_state: '',
  support_target_monthly: '',
  support_raised_pct: '',
  family_size: '',
  bio: '',
  website: ''
};

function numOrNull(value) {
  return value === '' ? null : Number(value);
}

// Stored and rendered as a plain URL — never as raw HTML or an embedded
// <img>/iframe — so a submission links out rather than hotlinking content.
// A bare domain (no scheme) is treated as https, matching what most people
// actually type into a "website" field.
function normalizeWebsite(value) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function toFormState(profile) {
  return {
    display_name: profile.display_name || '',
    agency_name: profile.agency_name || '',
    field_region: profile.field_region || '',
    field_visibility: profile.field_visibility || 'region_only',
    home_base_city: profile.home_base_city || '',
    home_base_state: profile.home_base_state || '',
    support_target_monthly: profile.support_target_monthly ?? '',
    support_raised_pct: profile.support_raised_pct ?? '',
    family_size: profile.family_size ?? '',
    bio: profile.bio || '',
    website: profile.website || ''
  };
}

// Renders once TypeGuardedOnboarding has confirmed the signed-in user has no
// missionary_profiles or church_profiles row yet. Matches Checklist.jsx's
// ProfileSetup pattern for auth: fetch the user id at submit time via
// supabase.auth.getUser() rather than threading session down as a prop.
//
// Also reused, in edit mode, by MissionaryDashboard (Step 9): pass `initial`
// (the existing profile row + its current tag ids) and `onSaved`/`onCancel`,
// and the form switches from insert-and-show-review-confirmation to
// update-and-call-onSaved.
export default function MissionaryOnboardingForm({ initial, onSaved, onCancel }) {
  const isEdit = !!initial;
  const [form, setForm] = useState(() => (initial ? toFormState(initial.profile) : INITIAL_FORM));
  const [tags, setTags] = useState(null); // null = loading
  const [tagsError, setTagsError] = useState(null);
  const [selectedTagIds, setSelectedTagIds] = useState(() => new Set(initial?.tagIds || []));
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

    // status/verification are deliberately omitted from both paths — the DB
    // defaults them to pending_review/self_reported on insert, and a
    // trigger blocks any later attempt by this same user to change them on
    // update (see supabase/schema.sql), so an edit can never silently
    // re-review or re-verify a profile.
    const payload = {
      display_name: form.display_name,
      agency_name: form.agency_name || null,
      field_region: form.field_region || null,
      field_visibility: form.field_visibility,
      home_base_city: form.home_base_city || null,
      home_base_state: form.home_base_state || null,
      support_target_monthly: numOrNull(form.support_target_monthly),
      support_raised_pct: numOrNull(form.support_raised_pct),
      family_size: numOrNull(form.family_size),
      bio: form.bio || null,
      website: normalizeWebsite(form.website)
    };

    const { error: saveError } = isEdit
      ? await supabase.from('missionary_profiles').update(payload).eq('id', user.id)
      : await supabase.from('missionary_profiles').insert({ id: user.id, ...payload });

    if (saveError) {
      setSubmitting(false);
      setSubmitError(saveError.message);
      return;
    }

    // Edit mode reconciles the full tag set (delete then re-insert what's
    // checked) so unchecking a tag actually removes it — create mode has
    // nothing to delete yet, so it only ever inserts.
    if (isEdit) {
      const { error: deleteTagsError } = await supabase
        .from('missionary_doctrinal_tags')
        .delete()
        .eq('missionary_id', user.id);
      if (deleteTagsError) {
        setSubmitting(false);
        setTagsSaveWarning("Your profile was saved, but your doctrinal tags couldn't be updated.");
        onSaved?.();
        return;
      }
    }

    if (selectedTagIds.size > 0) {
      const { error: tagsInsertError } = await supabase
        .from('missionary_doctrinal_tags')
        .insert([...selectedTagIds].map((tagId) => ({ missionary_id: user.id, tag_id: tagId })));
      if (tagsInsertError) {
        setTagsSaveWarning(
          "Your profile was saved, but your doctrinal tags couldn't be — you can add them later from your dashboard."
        );
      }
    }

    setSubmitting(false);
    if (isEdit) {
      onSaved?.();
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="onboarding-auth onboarding-confirmation">
        <CheckCircle weight="bold" size={28} />
        <h2>Thanks — your profile is under review.</h2>
        <p>
          It won't show up in the church directory yet. We'll let you know once it's approved.
        </p>
        {tagsSaveWarning && (
          <p className="onboarding-warning" role="alert">{tagsSaveWarning}</p>
        )}
      </div>
    );
  }

  return (
    <form className="onboarding-form" onSubmit={handleSubmit}>
      <h2>{isEdit ? 'Edit your missionary profile' : 'Your missionary profile'}</h2>
      <p className="onboarding-form-intro">
        {isEdit
          ? "Changes save immediately — they don't reset your review status."
          : "This goes to review before it's visible to any church — nothing here is public yet."}
      </p>

      <label>
        Display name
        <input
          type="text"
          required
          value={form.display_name}
          onChange={(e) => updateField('display_name', e.target.value)}
        />
      </label>

      <label>
        Agency name
        <input
          type="text"
          value={form.agency_name}
          onChange={(e) => updateField('agency_name', e.target.value)}
        />
      </label>

      <label>
        Field region
        <input
          type="text"
          value={form.field_region}
          onChange={(e) => updateField('field_region', e.target.value)}
        />
      </label>

      <label>
        Who can see your region?
        <select
          value={form.field_visibility}
          onChange={(e) => updateField('field_visibility', e.target.value)}
        >
          {VISIBILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

      <div className="onboarding-form-row">
        <label>
          Home base city
          <input
            type="text"
            value={form.home_base_city}
            onChange={(e) => updateField('home_base_city', e.target.value)}
          />
        </label>
        <label>
          Home base state
          <input
            type="text"
            value={form.home_base_state}
            onChange={(e) => updateField('home_base_state', e.target.value)}
          />
        </label>
      </div>

      <div className="onboarding-form-row">
        <label>
          Monthly support target ($)
          <input
            type="number"
            min="0"
            value={form.support_target_monthly}
            onChange={(e) => updateField('support_target_monthly', e.target.value)}
          />
        </label>
        <label>
          Support raised (%)
          <input
            type="number"
            min="0"
            max="100"
            value={form.support_raised_pct}
            onChange={(e) => updateField('support_raised_pct', e.target.value)}
          />
        </label>
      </div>

      <label>
        Family size
        <input
          type="number"
          min="0"
          value={form.family_size}
          onChange={(e) => updateField('family_size', e.target.value)}
        />
      </label>

      <label>
        Bio
        <textarea
          rows={5}
          value={form.bio}
          onChange={(e) => updateField('bio', e.target.value)}
        />
      </label>

      <label>
        Website
        <input
          type="text"
          inputMode="url"
          placeholder="yourministry.org"
          value={form.website}
          onChange={(e) => updateField('website', e.target.value)}
        />
        <span className="onboarding-form-hint">Shown on your profile as a link — never embedded.</span>
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

      <div className="onboarding-form-actions">
        <button type="submit" disabled={submitting}>
          {isEdit ? (submitting ? 'Saving…' : 'Save changes') : (submitting ? 'Submitting…' : 'Submit for review')}
        </button>
        {isEdit && onCancel && (
          <button type="button" className="onboarding-form-cancel" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
      {submitError && <p className="onboarding-error" role="alert">{submitError}</p>}
    </form>
  );
}
