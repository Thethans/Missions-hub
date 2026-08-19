import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { CATEGORY_LABELS, groupTagsByCategory } from '../data/doctrinalTagCategories.js';
import { churchLocationText, churchTags, engagementLabels, givingCapacityLabel } from '../data/churchDisplay.js';

// Mirrors MissionaryProfile.jsx's structure, trimmed to what church_profiles
// has. No Request Intro section here — intro_requests is a church-initiates,
// missionary-responds table (see supabase/schema.sql); there's no reverse
// flow for a missionary to request a church, so contact_name/contact_role
// and website are the way a missionary reaches out, same as any other
// directory listing.
export default function ChurchProfile({ churchId }) {
  const [church, setChurch] = useState(undefined); // undefined = loading, null = not found
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    // RLS (church_profiles_public_read_approved / _owner_read) already
    // restricts non-owner reads to status='approved' — no extra .eq needed.
    supabase
      .from('church_profiles')
      .select('*, church_doctrinal_tags ( doctrinal_tags ( id, label, category ) )')
      .eq('id', churchId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setLoadError(error.message);
          return;
        }
        setChurch(data || null);
      });
    return () => {
      cancelled = true;
    };
  }, [churchId]);

  if (loadError) {
    return (
      <p className="onboarding-error" role="alert">
        Couldn't load this profile right now — try refreshing the page.
      </p>
    );
  }

  if (church === undefined) {
    return <p className="onboarding-loading" role="status">Loading profile…</p>;
  }

  if (church === null) {
    return (
      <div className="directory-empty">
        <p>This church profile isn't available.</p>
        <Link to="/for-missionaries">Back to the directory</Link>
      </div>
    );
  }

  const tags = churchTags(church);
  const capacityLabel = givingCapacityLabel(church);
  const engagement = engagementLabels(church);
  const contact = [church.contact_name, church.contact_role].filter(Boolean).join(', ');

  return (
    <div className="profile-detail">
      <div className="directory-card-header">
        {church.denomination && (
          <span className="directory-card-agency">{church.denomination}</span>
        )}
      </div>

      <h1 className="profile-detail-title">{church.church_name}</h1>

      <div className="directory-card-meta">
        <span className="directory-card-tag">{churchLocationText(church)}</span>
        {capacityLabel && <span className="directory-card-tag">{capacityLabel}</span>}
      </div>

      {church.bio && (
        <section className="profile-detail-section">
          <h2>About</h2>
          <p>{church.bio}</p>
        </section>
      )}

      {church.missions_focus && (
        <section className="profile-detail-section">
          <h2>Current missions focus</h2>
          <p>{church.missions_focus}</p>
        </section>
      )}

      {contact && (
        <section className="profile-detail-section">
          <h2>Point of contact</h2>
          <p>{contact}</p>
        </section>
      )}

      {church.website && (
        <section className="profile-detail-section">
          <h2>Website</h2>
          <p>
            <a href={church.website} target="_blank" rel="noopener noreferrer nofollow">
              {church.website.replace(/^https?:\/\//i, '')}
            </a>
          </p>
        </section>
      )}

      {engagement.length > 0 && (
        <section className="profile-detail-section">
          <h2>How this church engages</h2>
          <div className="directory-tags-row">
            {engagement.map((label) => (
              <span key={label} className="directory-tag-pill">{label}</span>
            ))}
          </div>
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
    </div>
  );
}
