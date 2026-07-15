import { useEffect, useState } from 'react';
import type { MissionaryUpdate, PrayerRequest } from '../data/types';

interface UpdatesFeedProps {
  updates: MissionaryUpdate[];
  prayerRequests: PrayerRequest[];
  /** Used to build descriptive alt text, e.g. "Rebecca Johnson: 60 children reading". */
  missionaryName: string;
}

/**
 * The urgent/"fire" update gets a red-bordered treatment — matching the
 * reference: the first update, when the missionary has an urgent request and
 * the update's title mentions "fire".
 */
function isUrgentUpdate(update: MissionaryUpdate, index: number, prayerRequests: PrayerRequest[]): boolean {
  return (
    index === 0 &&
    prayerRequests.some((r) => r.type === 'urgent') &&
    update.title.toLowerCase().includes('fire')
  );
}

export default function UpdatesFeed({ updates, prayerRequests, missionaryName }: UpdatesFeedProps) {
  // The update currently expanded into the lightbox, or null.
  const [expanded, setExpanded] = useState<MissionaryUpdate | null>(null);

  // Close the lightbox on Escape. Capture-phase + stopPropagation so this
  // handles Escape before the page-level handler closes the whole card.
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setExpanded(null);
      }
    };
    document.addEventListener('keydown', onKey, { capture: true });
    return () => document.removeEventListener('keydown', onKey, { capture: true });
  }, [expanded]);

  return (
    <>
      <h3 className="pm-sec-label pm-sec-label--spaced">Latest Updates</h3>
      {updates.map((u, i) => (
        <button
          key={i}
          type="button"
          className={isUrgentUpdate(u, i, prayerRequests) ? 'pm-update pm-update--urgent' : 'pm-update'}
          onClick={() => setExpanded(u)}
          aria-label={`View update: ${u.title}`}
        >
          <img
            className="pm-update__photo"
            src={u.photo}
            alt={`${missionaryName}: ${u.title}`}
            width={u.photoWidth}
            height={u.photoHeight}
            loading="lazy"
          />
          <div className="pm-update__content">
            <div className="pm-update__head">
              <span className="pm-update__title">{u.title}</span>
              <span className="pm-update__date">{u.date}</span>
            </div>
            <p className="pm-update__text">{u.text}</p>
          </div>
          <span className="pm-update__expand" aria-hidden="true">
            ⤢
          </span>
        </button>
      ))}

      {expanded && (
        <div className="pm-update-lightbox" role="presentation" onClick={() => setExpanded(null)}>
          <div
            className="pm-update-lightbox__panel"
            role="dialog"
            aria-modal="true"
            aria-label={expanded.title}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="pm-update-lightbox__close"
              onClick={() => setExpanded(null)}
              aria-label="Close"
            >
              ✕
            </button>
            <img
              className="pm-update-lightbox__photo"
              src={expanded.photo}
              alt={`${missionaryName}: ${expanded.title}`}
              width={expanded.photoWidth}
              height={expanded.photoHeight}
            />
            <div className="pm-update-lightbox__body">
              <div className="pm-update-lightbox__head">
                <h4 className="pm-update-lightbox__title">{expanded.title}</h4>
                <span className="pm-update-lightbox__date">{expanded.date}</span>
              </div>
              <p className="pm-update-lightbox__text">{expanded.text}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
