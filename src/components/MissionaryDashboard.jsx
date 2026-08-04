import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import useSupabaseSession from '../hooks/useSupabaseSession.js';
import MagicLinkSignIn from './MagicLinkSignIn.jsx';
import MissionaryOnboardingForm from './MissionaryOnboardingForm.jsx';
import { locationText, missionaryTags, VERIFICATION_LABEL } from '../data/missionaryDisplay.js';

const STATUS_LABEL = {
  pending_review: 'Pending review',
  approved: 'Approved',
  rejected: 'Rejected',
  inactive: 'Inactive'
};

function IntroRequestRow({ request, onRespond }) {
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState(null);

  async function respond(status) {
    setResponding(true);
    setError(null);
    const { error: updateError } = await supabase
      .from('intro_requests')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('id', request.id);
    setResponding(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onRespond(request.id, status);
  }

  return (
    <li className="dashboard-request-row">
      <div>
        <p className="dashboard-request-church">{request.church_profiles?.church_name || 'A church'}</p>
        {request.message && <p className="dashboard-request-message">{request.message}</p>}
        {request.status !== 'requested' && (
          <p className="dashboard-request-status">{STATUS_LABEL[request.status] || request.status}</p>
        )}
      </div>
      {request.status === 'requested' && (
        <div className="dashboard-request-actions">
          <button type="button" disabled={responding} onClick={() => respond('accepted')}>
            Accept
          </button>
          <button
            type="button"
            className="dashboard-request-decline"
            disabled={responding}
            onClick={() => respond('declined')}
          >
            Decline
          </button>
        </div>
      )}
      {error && <p className="onboarding-error" role="alert">{error}</p>}
    </li>
  );
}

function ProfileSummary({ profile, onEdit }) {
  const tags = missionaryTags(profile);
  return (
    <div className="dashboard-summary">
      <div className="directory-card-header">
        {profile.agency_name && <span className="directory-card-agency">{profile.agency_name}</span>}
        <span className="directory-badge">{STATUS_LABEL[profile.status] || profile.status}</span>
      </div>
      <h2 className="profile-detail-title">{profile.display_name}</h2>
      <div className="directory-card-meta">
        <span className="directory-card-tag">{locationText(profile)}</span>
        <span className="directory-card-tag">{VERIFICATION_LABEL[profile.verification] || 'Self-reported'}</span>
      </div>
      {tags.length > 0 && (
        <div className="directory-tags-row">
          {tags.map((tag) => (
            <span key={tag.id} className="directory-tag-pill">{tag.label}</span>
          ))}
        </div>
      )}
      <button type="button" className="dashboard-edit-btn" onClick={onEdit}>
        Edit profile
      </button>
    </div>
  );
}

export default function MissionaryDashboard() {
  const { session, loading: sessionLoading } = useSupabaseSession();
  const [profile, setProfile] = useState(undefined); // undefined = loading, null = no profile
  const [loadError, setLoadError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [requests, setRequests] = useState(undefined);
  const [requestsError, setRequestsError] = useState(null);

  const loadProfile = useCallback(() => {
    if (!supabase || !session) return;
    setProfile(undefined);
    supabase
      .from('missionary_profiles')
      .select('*, missionary_doctrinal_tags ( doctrinal_tags ( id, label, category ) )')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          return;
        }
        setProfile(data || null);
      });
  }, [session]);

  const loadRequests = useCallback(() => {
    if (!supabase || !session) return;
    supabase
      .from('intro_requests')
      .select('*, church_profiles ( church_name )')
      .eq('missionary_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setRequestsError(error.message);
          return;
        }
        setRequests(data || []);
      });
  }, [session]);

  useEffect(() => {
    loadProfile();
    loadRequests();
  }, [loadProfile, loadRequests]);

  function handleRequestResponded(requestId, status) {
    setRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status, responded_at: new Date().toISOString() } : r))
    );
  }

  if (!supabase) {
    return (
      <p className="onboarding-error" role="alert">
        Sign-in isn't available right now — please try again later.
      </p>
    );
  }

  if (sessionLoading) {
    return <p className="onboarding-loading" role="status">Loading…</p>;
  }

  if (!session) {
    return <MagicLinkSignIn redirectPath="/missionary-support" />;
  }

  if (loadError) {
    return (
      <p className="onboarding-error" role="alert">
        Couldn't load your dashboard right now — try refreshing the page.
      </p>
    );
  }

  if (profile === undefined) {
    return <p className="onboarding-loading" role="status">Loading your profile…</p>;
  }

  if (profile === null) {
    return (
      <div className="onboarding-auth">
        <p>This account doesn't have a missionary profile yet.</p>
        <Link to="/missionary-support/onboarding">Create one</Link>
      </div>
    );
  }

  const pending = requests?.filter((r) => r.status === 'requested') || [];
  const past = requests?.filter((r) => r.status !== 'requested') || [];

  return (
    <div className="dashboard">
      {editing ? (
        <MissionaryOnboardingForm
          initial={{ profile, tagIds: [...missionaryTags(profile).map((t) => t.id)] }}
          onSaved={() => {
            setEditing(false);
            loadProfile();
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <ProfileSummary profile={profile} onEdit={() => setEditing(true)} />
      )}

      <section className="profile-detail-section">
        <h2 className="dashboard-section-title">Intro requests</h2>

        {requestsError && (
          <p className="onboarding-error" role="alert">
            Couldn't load intro requests right now — try refreshing the page.
          </p>
        )}
        {requests === undefined && !requestsError && (
          <p className="onboarding-loading" role="status">Loading intro requests…</p>
        )}
        {requests && requests.length === 0 && <p className="dashboard-empty">No intro requests yet.</p>}

        {pending.length > 0 && (
          <ul className="dashboard-request-list">
            {pending.map((request) => (
              <IntroRequestRow key={request.id} request={request} onRespond={handleRequestResponded} />
            ))}
          </ul>
        )}
        {pending.length === 0 && requests && requests.length > 0 && (
          <p className="dashboard-empty">No pending intro requests.</p>
        )}

        {past.length > 0 && (
          <details className="dashboard-past-requests">
            <summary>Past requests ({past.length})</summary>
            <ul className="dashboard-request-list">
              {past.map((request) => (
                <IntroRequestRow key={request.id} request={request} onRespond={handleRequestResponded} />
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
