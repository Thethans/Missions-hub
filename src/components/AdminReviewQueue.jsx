import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

const MISSIONARY_FIELDS = [
  ['agency_name', 'Agency'],
  ['field_region', 'Field region'],
  ['field_visibility', 'Field visibility'],
  ['home_base_city', 'Home base city'],
  ['home_base_state', 'Home base state'],
  ['support_target_monthly', 'Monthly support target'],
  ['support_raised_pct', 'Support raised (%)'],
  ['family_size', 'Family size'],
  ['bio', 'Bio'],
  ['website', 'Website']
];

const CHURCH_FIELDS = [
  ['city', 'City'],
  ['state', 'State'],
  ['denomination', 'Denomination'],
  ['giving_capacity_tier', 'Giving capacity'],
  ['website', 'Website']
];

function tagLabels(joinRows, tagKey) {
  return (joinRows || [])
    .map((r) => r[tagKey]?.label)
    .filter(Boolean);
}

function ProfileCard({ title, fields, row, tags, onApprove, onReject, actioning }) {
  return (
    <article className="review-card">
      <h3>{title}</h3>
      <dl className="review-card-fields">
        {fields.map(([key, label]) => (
          row[key] !== null && row[key] !== undefined && row[key] !== '' ? (
            <React.Fragment key={key}>
              <dt>{label}</dt>
              <dd>
                {key === 'website' ? (
                  // A plain hyperlink to review, never rendered/embedded as
                  // HTML from the submission itself.
                  <a href={row[key]} target="_blank" rel="noopener noreferrer nofollow">
                    {row[key]}
                  </a>
                ) : (
                  String(row[key])
                )}
              </dd>
            </React.Fragment>
          ) : null
        ))}
      </dl>
      <p className="review-card-tags">
        {tags.length > 0 ? tags.join(', ') : 'No doctrinal tags selected.'}
      </p>
      <div className="review-card-actions">
        <button
          type="button"
          className="review-card-approve"
          disabled={actioning}
          onClick={onApprove}
        >
          Approve
        </button>
        <button
          type="button"
          className="review-card-reject"
          disabled={actioning}
          onClick={onReject}
        >
          Reject
        </button>
      </div>
    </article>
  );
}

export default function AdminReviewQueue() {
  const [missionaries, setMissionaries] = useState(null);
  const [missionariesError, setMissionariesError] = useState(null);
  const [churches, setChurches] = useState(null);
  const [churchesError, setChurchesError] = useState(null);
  const [actioningId, setActioningId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadMissionaries = useCallback(() => {
    if (!supabase) return;
    supabase
      .from('missionary_profiles')
      .select('*, missionary_doctrinal_tags ( doctrinal_tags ( label ) )')
      .eq('status', 'pending_review')
      .order('created_at')
      .then(({ data, error }) => {
        if (error) {
          setMissionariesError(error.message);
          return;
        }
        setMissionariesError(null);
        setMissionaries(data || []);
      });
  }, []);

  const loadChurches = useCallback(() => {
    if (!supabase) return;
    supabase
      .from('church_profiles')
      .select('*, church_doctrinal_tags ( doctrinal_tags ( label ) )')
      .eq('status', 'pending_review')
      .order('created_at')
      .then(({ data, error }) => {
        if (error) {
          setChurchesError(error.message);
          return;
        }
        setChurchesError(null);
        setChurches(data || []);
      });
  }, []);

  useEffect(() => {
    loadMissionaries();
    loadChurches();
  }, [loadMissionaries, loadChurches]);

  async function reviewMissionary(id, status) {
    setActioningId(id);
    setActionError(null);
    const { error } = await supabase.from('missionary_profiles').update({ status }).eq('id', id);
    setActioningId(null);
    if (error) {
      setActionError(error.message);
      return;
    }
    setMissionaries((prev) => prev.filter((row) => row.id !== id));
  }

  async function reviewChurch(id, status) {
    setActioningId(id);
    setActionError(null);
    const { error } = await supabase.from('church_profiles').update({ status }).eq('id', id);
    setActioningId(null);
    if (error) {
      setActionError(error.message);
      return;
    }
    setChurches((prev) => prev.filter((row) => row.id !== id));
  }

  return (
    <div className="review-queue">
      {actionError && <p className="onboarding-error" role="alert">{actionError}</p>}

      <section className="review-queue-section">
        <h2>Missionary profiles</h2>
        {missionariesError && (
          <p className="onboarding-error" role="alert">
            Couldn't load missionary profiles: {missionariesError}
          </p>
        )}
        {missionaries === null && !missionariesError && (
          <p className="onboarding-loading" role="status">Loading…</p>
        )}
        {missionaries && missionaries.length === 0 && (
          <p className="review-queue-empty">No missionary profiles are pending review.</p>
        )}
        {missionaries && missionaries.length > 0 && (
          <div className="review-card-list">
            {missionaries.map((row) => (
              <ProfileCard
                key={row.id}
                title={row.display_name}
                fields={MISSIONARY_FIELDS}
                row={row}
                tags={tagLabels(row.missionary_doctrinal_tags, 'doctrinal_tags')}
                actioning={actioningId === row.id}
                onApprove={() => reviewMissionary(row.id, 'approved')}
                onReject={() => reviewMissionary(row.id, 'rejected')}
              />
            ))}
          </div>
        )}
      </section>

      <section className="review-queue-section">
        <h2>Church profiles</h2>
        {churchesError && (
          <p className="onboarding-error" role="alert">
            Couldn't load church profiles: {churchesError}
          </p>
        )}
        {churches === null && !churchesError && (
          <p className="onboarding-loading" role="status">Loading…</p>
        )}
        {churches && churches.length === 0 && (
          <p className="review-queue-empty">No church profiles are pending review.</p>
        )}
        {churches && churches.length > 0 && (
          <div className="review-card-list">
            {churches.map((row) => (
              <ProfileCard
                key={row.id}
                title={row.church_name}
                fields={CHURCH_FIELDS}
                row={row}
                tags={tagLabels(row.church_doctrinal_tags, 'doctrinal_tags')}
                actioning={actioningId === row.id}
                onApprove={() => reviewChurch(row.id, 'approved')}
                onReject={() => reviewChurch(row.id, 'rejected')}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
