import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, CheckCircle } from '@phosphor-icons/react';
import { supabase } from '../supabaseClient.js';
import useSupabaseSession from '../hooks/useSupabaseSession.js';
import { CATEGORY_LABELS, groupTagsByCategory } from '../data/doctrinalTagCategories.js';
import { locationText, missionaryTags, VERIFICATION_LABEL } from '../data/missionaryDisplay.js';
import MissionaryAvatar from './MissionaryAvatar.jsx';

function RequestIntroForm({ missionaryId, onSent }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) {
      setSubmitting(false);
      setError(userError?.message || 'Your session expired — please sign in again.');
      return;
    }

    const { error: insertError } = await supabase
      .from('intro_requests')
      .insert({ church_id: user.id, missionary_id: missionaryId, message: message || null });

    setSubmitting(false);
    if (insertError) {
      // 23505 = unique_violation — the DB's own duplicate-pending guard
      // (intro_requests_no_duplicate_pending) can still fire here even
      // though the page already checks for this, e.g. a second tab.
      setError(
        insertError.code === '23505'
          ? 'You already have a pending request for this missionary.'
          : insertError.message
      );
      return;
    }
    onSent();
  }

  return (
    <form className="onboarding-form profile-request-form" onSubmit={handleSubmit}>
      <label>
        Message (optional)
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Introduce your church and why you'd like to connect…"
        />
      </label>
      <button type="submit" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send request'}
      </button>
      {error && <p className="onboarding-error" role="alert">{error}</p>}
    </form>
  );
}

// Church-eligibility + existing-request checks are scoped to this page
// (unlike useSupabaseSession/useAccountProfileType, which are shared across
// five routes) — not worth a dedicated hook for a check only this component
// makes.
function RequestIntroSection({ missionaryId }) {
  const { session, loading: sessionLoading } = useSupabaseSession();
  const [churchStatus, setChurchStatus] = useState(undefined); // undefined = loading/unknown
  const [existingRequest, setExistingRequest] = useState(undefined); // undefined = loading/n-a
  const [formOpen, setFormOpen] = useState(false);
  const [justSent, setJustSent] = useState(false);

  useEffect(() => {
    if (!supabase || !session) {
      setChurchStatus(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('church_profiles')
      .select('status')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setChurchStatus(data?.status || null);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  useEffect(() => {
    if (!supabase || !session || churchStatus !== 'approved') {
      setExistingRequest(undefined);
      return;
    }
    let cancelled = false;
    supabase
      .from('intro_requests')
      .select('id')
      .eq('church_id', session.user.id)
      .eq('missionary_id', missionaryId)
      .eq('status', 'requested')
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setExistingRequest(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [session, churchStatus, missionaryId]);

  if (sessionLoading || (session && churchStatus === undefined)) {
    return <p className="onboarding-loading" role="status">Checking your account…</p>;
  }

  if (justSent || (churchStatus === 'approved' && existingRequest)) {
    return (
      <button type="button" className="profile-request-btn" disabled>
        Request pending
      </button>
    );
  }

  const eligible = session && churchStatus === 'approved';

  if (formOpen && eligible) {
    return (
      <RequestIntroForm
        missionaryId={missionaryId}
        onSent={() => {
          setFormOpen(false);
          setJustSent(true);
        }}
      />
    );
  }

  return (
    <div>
      <button
        type="button"
        className="profile-request-btn"
        disabled={!eligible}
        onClick={() => setFormOpen(true)}
      >
        Request Intro
      </button>
      {!session && (
        <p className="profile-request-hint">Sign in with an approved church profile to request an intro.</p>
      )}
      {session && churchStatus !== 'approved' && (
        <p className="profile-request-hint">Only approved churches can request an introduction.</p>
      )}
    </div>
  );
}

export default function MissionaryProfile({ missionaryId }) {
  const [missionary, setMissionary] = useState(undefined); // undefined = loading, null = not found
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    // RLS (missionary_profiles_public_read_approved / _owner_read /
    // _admin_read) already restricts what a non-owner, non-admin caller can
    // see to status='approved' rows — no extra .eq('status', 'approved')
    // needed here, and adding one would just mean an owner previewing their
    // own pending profile via this same page gets zero rows instead.
    supabase
      .from('missionary_profiles')
      .select('*, missionary_doctrinal_tags ( doctrinal_tags ( id, label, category ) )')
      .eq('id', missionaryId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoadError(error.message);
          return;
        }
        setMissionary(data || null);
      });
    return () => {
      cancelled = true;
    };
  }, [missionaryId]);

  if (loadError) {
    return (
      <p className="onboarding-error" role="alert">
        Couldn't load this profile right now — try refreshing the page.
      </p>
    );
  }

  if (missionary === undefined) {
    return <p className="onboarding-loading" role="status">Loading profile…</p>;
  }

  if (missionary === null) {
    return (
      <div className="directory-empty">
        <p>This missionary profile isn't available.</p>
        <Link to="/for-churches">Back to the directory</Link>
      </div>
    );
  }

  const tags = missionaryTags(missionary);

  return (
    <div className="profile-detail">
      <div className="directory-card-header">
        {missionary.agency_name && (
          <span className="directory-card-agency">{missionary.agency_name}</span>
        )}
        <span
          className={`directory-badge${missionary.verification === 'agency_verified' ? ' directory-badge--verified' : ''}`}
        >
          {missionary.verification === 'agency_verified' && <CheckCircle weight="fill" size={14} />}
          {VERIFICATION_LABEL[missionary.verification] || 'Self-reported'}
        </span>
      </div>

      <div className="profile-detail-identity">
        <MissionaryAvatar missionary={missionary} className="profile-detail-avatar" />
        <h1 className="profile-detail-title">{missionary.display_name}</h1>
      </div>

      <div className="directory-card-meta">
        <span className="directory-card-tag">
          <MapPin size={14} weight="bold" /> {locationText(missionary)}
        </span>
      </div>

      {missionary.support_raised_pct !== null && missionary.support_raised_pct !== undefined && (
        <div className="directory-progress">
          <div className="directory-progress-bar">
            <div
              className="directory-progress-fill"
              style={{ width: `${Math.min(100, Math.max(0, missionary.support_raised_pct))}%` }}
            />
          </div>
          <span className="directory-progress-label">{missionary.support_raised_pct}% of support raised</span>
        </div>
      )}

      {missionary.bio && (
        <section className="profile-detail-section">
          <h2>About</h2>
          <p>{missionary.bio}</p>
        </section>
      )}

      {(missionary.home_base_city || missionary.home_base_state) && (
        <section className="profile-detail-section">
          <h2>Home base</h2>
          <p>{[missionary.home_base_city, missionary.home_base_state].filter(Boolean).join(', ')}</p>
        </section>
      )}

      {missionary.website && (
        <section className="profile-detail-section">
          <h2>Website</h2>
          <p>
            <a href={missionary.website} target="_blank" rel="noopener noreferrer nofollow">
              {missionary.website.replace(/^https?:\/\//i, '')}
            </a>
          </p>
        </section>
      )}

      {(missionary.support_target_monthly || missionary.family_size) && (
        <section className="profile-detail-section">
          <h2>Support</h2>
          {missionary.support_target_monthly && (
            <p>Monthly target: ${missionary.support_target_monthly.toLocaleString()}</p>
          )}
          {missionary.family_size !== null && missionary.family_size !== undefined && (
            <p>Family size: {missionary.family_size}</p>
          )}
        </section>
      )}

      {tags.length > 0 && (
        <section className="profile-detail-section">
          <h2>Doctrinal positions</h2>
          {[...groupTagsByCategory(tags)].map(([category, categoryTags]) => (
            <div className="profile-detail-tag-group" key={category}>
              <h3>{CATEGORY_LABELS[category] || category}</h3>
              <div className="directory-tags-row">
                {categoryTags.map((tag) => (
                  <span key={tag.id} className="directory-tag-pill">{tag.label}</span>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="profile-detail-section profile-request">
        <RequestIntroSection missionaryId={missionary.id} />
      </section>
    </div>
  );
}
