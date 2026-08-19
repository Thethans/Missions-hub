import React, { useEffect, useMemo, useState } from 'react';
import { Globe } from '@phosphor-icons/react';
import { supabase } from '../supabaseClient.js';
import { CATEGORY_LABELS, groupTagsByCategory } from '../data/doctrinalTagCategories.js';
import { churchLocationText, churchTagIds, churchTags } from '../data/churchDisplay.js';

// Mirrors MissionaryDirectory.jsx's card, trimmed to what church_profiles
// actually has: no verification level and no support-raised progress bar
// (both missionary-only fields), and no link to an individual profile page
// — there's no church-detail route (the symmetric /for-churches/:id one
// exists for missionaries; nothing plays that role for churches yet), so
// the card is informational rather than a link target.
function ChurchCard({ church }) {
  const tags = churchTags(church).map((t) => t.label);
  return (
    <article className="directory-card">
      <div className="directory-card-header">
        {church.denomination && (
          <span className="directory-card-agency">{church.denomination}</span>
        )}
      </div>

      <h2 className="directory-card-title">{church.church_name}</h2>

      <div className="directory-card-meta">
        <span className="directory-card-tag">{churchLocationText(church)}</span>
      </div>

      {church.website && (
        <a href={church.website} target="_blank" rel="noreferrer" className="directory-card-website">
          <Globe size={14} weight="bold" /> {church.website.replace(/^https?:\/\//, '')}
        </a>
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

export default function ChurchDirectory() {
  const [churches, setChurches] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState(new Set());
  const [selectedState, setSelectedState] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('doctrinal_tags')
      .select('*')
      .order('category')
      .order('label')
      .then(({ data }) => setAllTags(data || []));

    supabase
      .from('church_profiles')
      .select('*, church_doctrinal_tags ( doctrinal_tags ( id, label, category ) )')
      .eq('status', 'approved')
      .order('church_name')
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          return;
        }
        setChurches(data || []);
      });
  }, []);

  const states = useMemo(() => {
    if (!churches) return [];
    return [...new Set(churches.filter((c) => c.state).map((c) => c.state))].sort();
  }, [churches]);

  const filtered = useMemo(() => {
    if (!churches) return [];
    return churches.filter((c) => {
      if (selectedTagIds.size > 0) {
        const tagIds = churchTagIds(c);
        for (const tagId of selectedTagIds) {
          if (!tagIds.has(tagId)) return false;
        }
      }
      if (selectedState && c.state !== selectedState) return false;
      return true;
    });
  }, [churches, selectedTagIds, selectedState]);

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
    setSelectedState('');
  }

  const filtersActive = selectedTagIds.size > 0 || selectedState !== '';

  if (loadError) {
    return (
      <p className="onboarding-error" role="alert">
        Couldn't load the directory right now — try refreshing the page.
      </p>
    );
  }

  if (churches === null) {
    return <p className="onboarding-loading" role="status">Loading church profiles…</p>;
  }

  return (
    <div className="directory">
      <div className="directory-filters">
        {states.length > 0 && (
          <label className="directory-region-filter">
            State
            <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
              <option value="">All states</option>
              {states.map((state) => (
                <option key={state} value={state}>{state}</option>
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

      {churches.length === 0 && (
        <p className="directory-empty">No church profiles are public yet.</p>
      )}
      {churches.length > 0 && filtered.length === 0 && (
        <div className="directory-empty">
          <p>No church profiles match your current filters.</p>
          <button type="button" className="directory-clear-filters" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}
      {filtered.length > 0 && (
        <div className="directory-grid">
          {filtered.map((church) => (
            <ChurchCard key={church.id} church={church} />
          ))}
        </div>
      )}
    </div>
  );
}
