import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MissionaryUpdate, PrayerRequest } from '../data/types';

// CSS custom property carrying each photo's real aspect ratio into
// .pm-update__photo (see prayer-map.css) — TypeScript's CSSProperties
// doesn't know about arbitrary --custom-props, so this narrows the type
// just enough to assign one without an `any`/`as unknown` escape hatch.
type PhotoAspectStyle = CSSProperties & { '--pm-photo-aspect': string };

// .pm-update__photo fixes the thumbnail's height and lets width follow the
// photo's real aspect ratio — but width is also clamped between 48px and
// 112px so one extreme-ratio photo can't swallow the whole update row (see
// the CSS comment on .pm-update__photo). That pixel clamp used to run
// independently of the aspect-ratio the browser was told to honor, so for
// any photo ratio outside what a 64px-tall/48–112px-wide box actually
// allows, the two disagreed and object-fit:cover cropped harder than
// intended. Clamping the ratio itself here first — to exactly the range
// that 64px-tall box can represent at 48–112px wide — means the declared
// aspect-ratio and the rendered box always agree, so the CSS clamp below
// becomes a no-op safety net instead of silently fighting this value.
const THUMB_HEIGHT = 64;
const THUMB_MIN_WIDTH = 48;
const THUMB_MAX_WIDTH = 112;
const MIN_RATIO = THUMB_MIN_WIDTH / THUMB_HEIGHT;
const MAX_RATIO = THUMB_MAX_WIDTH / THUMB_HEIGHT;

function clampedPhotoAspect(width: number, height: number): string {
  if (!width || !height) return '4 / 3';
  const ratio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, width / height));
  return `${ratio}`;
}

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
            // Fixed thumbnail height, width driven by the photo's own
            // aspect ratio (see the CSS var read in .pm-update__photo) —
            // a portrait update stays narrow-and-tall, a landscape one
            // wide-and-short, instead of every photo getting cropped to
            // fit one fixed landscape box regardless of its real shape.
            // Ratio is pre-clamped (see clampedPhotoAspect above) so it
            // never disagrees with the CSS min/max-width safety net.
            style={{ '--pm-photo-aspect': clampedPhotoAspect(u.photoWidth, u.photoHeight) } as PhotoAspectStyle}
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
