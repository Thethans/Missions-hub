import React from 'react';
import { Compass, EnvelopeSimple, HandsPraying, PlayCircle } from '@phosphor-icons/react';
import RevealOnScroll from './RevealOnScroll.jsx';

function initials(fullName) {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

// Copies the OpportunityCard structure (header kicker + actions, display
// title, muted description, icon-tag meta row) per CLAUDE.md's card
// convention, with a prayer-need strip inserted below the header and a
// media thumbnail above the footer — the two things unique to a missionary
// card. Media_updates' full feed (photo grid / video iframes) is a later
// build step; this card only ever shows the single latest one.
export default function ChurchMissionaryCard({ missionary, index = 0 }) {
  const { currentPrayerNeed, pastPrayerNeeds, latestMediaUpdate } = missionary;

  return (
    <RevealOnScroll index={index} className="cm-card-wrapper">
      <article className="cm-card">
        <header className="cm-card-header">
          {missionary.photo_url ? (
            <img src={missionary.photo_url} alt="" className="cm-card-avatar" />
          ) : (
            <span className="cm-card-avatar cm-card-avatar--initials" aria-hidden="true">
              {initials(missionary.full_name)}
            </span>
          )}
          <div>
            {missionary.sending_agency && (
              <p className="cm-card-agency">{missionary.sending_agency}</p>
            )}
            <h2 className="cm-card-title">{missionary.full_name}</h2>
          </div>
        </header>

        {currentPrayerNeed && (
          <p className="cm-card-prayer-need">
            <HandsPraying size={16} weight="bold" />
            <span>{currentPrayerNeed.need_text}</span>
          </p>
        )}

        {pastPrayerNeeds.length > 0 && (
          <details className="cm-card-past-needs">
            <summary>Past prayer needs ({pastPrayerNeeds.length})</summary>
            <ul>
              {pastPrayerNeeds.map((need) => (
                <li key={need.id}>{need.need_text}</li>
              ))}
            </ul>
          </details>
        )}

        {missionary.family_summary && (
          <p className="cm-card-desc">{missionary.family_summary}</p>
        )}

        {missionary.ministry_field && (
          <div className="cm-card-meta">
            <span className="cm-card-tag">
              <Compass size={14} weight="bold" /> {missionary.ministry_field}
            </span>
          </div>
        )}

        {latestMediaUpdate && (
          <div className="cm-card-media">
            {latestMediaUpdate.media_type === 'photo' ? (
              <img src={latestMediaUpdate.url} alt="" className="cm-card-media-thumb" />
            ) : (
              <div className="cm-card-media-thumb cm-card-media-thumb--video" aria-hidden="true">
                <PlayCircle size={28} weight="fill" />
              </div>
            )}
            {latestMediaUpdate.caption && (
              <p className="cm-card-media-caption">{latestMediaUpdate.caption}</p>
            )}
          </div>
        )}

        {missionary.contact_email && (
          <div className="cm-card-footer">
            <a href={`mailto:${missionary.contact_email}`} className="cm-card-link">
              <EnvelopeSimple size={16} weight="bold" /> Contact
            </a>
          </div>
        )}
      </article>
    </RevealOnScroll>
  );
}
