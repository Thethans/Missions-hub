import type { PrayerRequest, PrayerRequestType } from '../data/types';

interface PrayerRequestsProps {
  requests: PrayerRequest[];
}

const TAG_LABEL: Record<Exclude<PrayerRequestType, 'urgent'>, string> = {
  sticky: 'Ongoing',
  auto: 'This Week'
};

/** Urgent requests lead the list; everything else keeps its authored order. */
function urgentFirst(requests: PrayerRequest[]): PrayerRequest[] {
  return [...requests].sort((a, b) => {
    if (a.type === 'urgent' && b.type !== 'urgent') return -1;
    if (b.type === 'urgent' && a.type !== 'urgent') return 1;
    return 0;
  });
}

export default function PrayerRequests({ requests }: PrayerRequestsProps) {
  return (
    <>
      <h3 className="pm-sec-label">Prayer Requests</h3>
      {urgentFirst(requests).map((r, i) =>
        r.type === 'urgent' ? (
          <div key={i} className="pm-prayer-req pm-prayer-req--urgent">
            <div className="pm-prayer-req__tag">
              <span className="pm-urgent-badge">URGENT</span>
            </div>
            <p className="pm-prayer-req__text">{r.text}</p>
          </div>
        ) : (
          <div key={i} className="pm-prayer-req">
            <div className="pm-prayer-req__tag">🙏 {TAG_LABEL[r.type]}</div>
            <p className="pm-prayer-req__text">{r.text}</p>
          </div>
        )
      )}
    </>
  );
}
