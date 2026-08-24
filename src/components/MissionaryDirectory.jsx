import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, CheckCircle } from '@phosphor-icons/react';
import { supabase } from '../supabaseClient.js';
import { CATEGORY_LABELS, groupTagsByCategory } from '../data/doctrinalTagCategories.js';
import { locationText, missionaryTagIds, missionaryTags, VERIFICATION_LABEL } from '../data/missionaryDisplay.js';
import MissionaryAvatar from './MissionaryAvatar.jsx';

function MissionaryCard({ missionary }) {
  const tags = missionaryTags(missionary).map((t) => t.label);
  return (
    <article className="directory-card">
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

      <div className="directory-card-identity">
        <MissionaryAvatar missionary={missionary} className="directory-card-avatar" />
        <h2 className="directory-card-title">
          <Link to={`/for-churches/${missionary.id}`}>{missionary.display_name}</Link>
        </h2>
      </div>

      {missionary.bio && <p className="directory-card-desc">{missionary.bio}</p>}

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

      {tags.length > 0 && (
        <div className="directory-tags-row">
          {tags.map((label) => (
            <span key={label} className="directory-tag-pill">{label}</span>
          ))}
        </div>
      )}
    </article>
  );
}

export default function MissionaryDirectory() {
  const [missionaries, setMissionaries] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState(new Set());
  const [selectedRegion, setSelectedRegion] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('doctrinal_tags')
      .select('*')
      .order('category')
      .order('label')
      .then(({ data }) => setAllTags(data || []));

    supabase
      .from('missionary_profiles')
      .select('*, missionary_doctrinal_tags ( doctrinal_tags ( id, label, category ) )')
      .eq('status', 'approved')
      .order('display_name')
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          return;
        }
        setMissionaries(data || []);
      });
  }, []);

  const regions = useMemo(() => {
    if (!missionaries) return [];
    const set = new Set(
      missionaries
        .filter((m) => m.field_visibility !== 'private' && m.field_region)
        .map((m) => m.field_region)
    );
    return [...set].sort();
  }, [missionaries]);

  const filtered = useMemo(() => {
    if (!missionaries) return [];
    return missionaries.filter((m) => {
      if (selectedTagIds.size > 0) {
        const tagIds = missionaryTagIds(m);
        for (const tagId of selectedTagIds) {
          if (!tagIds.has(tagId)) return false;
        }
      }
      if (selectedRegion) {
        if (m.field_visibility === 'private') return false;
        if (m.field_region !== selectedRegion) return false;
      }
      return true;
    });
  }, [missionaries, selectedTagIds, selectedRegion]);

  function toggleTag(tagId) {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) next.delete(tagId);
      else next.add(tagId);
      return next;
    });
  }

  function clearFilters() {
    setSelectedTagIds(new Set());
    setSelectedRegion('');
  }

  const filtersActive = selectedTagIds.size > 0 || selectedRegion !== '';

  if (loadError) {
    return (
      <p className="onboarding-error" role="alert">
        Couldn't load the directory right now — try refreshing the page.
      </p>
    );
  }

  if (missionaries === null) {
    return <p className="onboarding-loading" role="status">Loading missionary profiles…</p>;
  }

  return (
    <div className="directory">
      <div className="directory-filters">
        {regions.length > 0 && (
          <label className="directory-region-filter">
            Field region
            <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)}>
              <option value="">All regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </label>
        )}
        {allTags.length > 0 && (
          <div className="directory-tag-filters">
            {[...groupTagsByCategory(allTags)].map(([category, categoryTags]) => (
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
        {filtersActive && (
          <button type="button" className="directory-clear-filters" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {missionaries.length === 0 && (
        <p className="directory-empty">No missionary profiles are public yet.</p>
      )}
      {missionaries.length > 0 && filtered.length === 0 && (
        <div className="directory-empty">
          <p>No missionary profiles match your current filters.</p>
          <button type="button" className="directory-clear-filters" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="directory-grid">
          {filtered.map((missionary) => (
            <MissionaryCard key={missionary.id} missionary={missionary} />
          ))}
        </div>
      )}
    </div>
  );
}
