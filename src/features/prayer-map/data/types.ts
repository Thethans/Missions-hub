// Shared shapes for the prayer-map feature. All data here is hardcoded mock
// data (see missionaries.ts) — nothing is fetched. In a real build these would
// be Supabase records; see // TODO(real): notes at the integration points.

/**
 * Prayer-request cadence/severity.
 * - 'sticky' → an ongoing request the missionary pinned ("Ongoing" tag)
 * - 'auto'   → a recent/weekly request ("This Week" tag)
 * - 'urgent' → renders red with an URGENT badge, leads the list, and drives
 *              the urgent (red, pulsing) pin state on the map.
 */
export type PrayerRequestType = 'sticky' | 'auto' | 'urgent';

export interface PrayerRequest {
  text: string;
  type: PrayerRequestType;
}

/** Confidential request rendered only to a signed-in "member". */
export interface SensitiveRequest {
  text: string;
}

export interface BudgetLine {
  /** e.g. "Housing & utilities" */
  item: string;
  /** short description of what this line funds */
  purpose: string;
  /** monthly USD */
  amount: number;
}

export interface MissionaryUpdate {
  /** human relative string for the mock, e.g. "2 days ago" */
  date: string;
  title: string;
  text: string;
  /** mock image — an inline SVG-gradient data URI (no external hosting) */
  photo: string;
}

/**
 * A single missionary record. `monthlyNeed` and `raised` are derived from
 * `budget` and `supportGoal` (see deriveBudget.ts) rather than hand-typed, so
 * they can never drift out of sync with the line items.
 */
export interface Missionary {
  id: string;
  name: string;
  /**
   * Optional small-print line shown under the name in a muted, smaller size
   * (e.g. "Names changed for security") — for context that qualifies the name
   * without competing with it visually.
   */
  nameNote?: string;
  location: string;
  /** real latitude for the MapLibre marker */
  lat: number;
  /** real longitude for the MapLibre marker */
  lng: number;
  /** e.g. "Church Planting" */
  role: string;
  /** paragraph overview shown in "The Ministry" */
  ministry: string;
  prayerCount: number;
  /** percent funded, 0–100 */
  supportGoal: number;
  budget: BudgetLine[];
  prayerRequests: PrayerRequest[];
  /** empty for most; only Rebecca has entries */
  sensitive: SensitiveRequest[];
  updates: MissionaryUpdate[];
  /**
   * Set for missionaries serving in a security-sensitive ("creative access")
   * country, where publishing an exact location or identifying details could
   * endanger the worker or the local believers they serve. When true:
   *  - the map renders a soft, deliberately imprecise area instead of a pin
   *    (see MissionaryPin.createApproximatePinElement) — `lat`/`lng` hold a
   *    generalized point, not the real (fictional) location;
   *  - the card shows a security notice and keeps names/photos withheld or
   *    illustrated rather than photographed.
   * TODO(real): this flag would gate server-side redaction too — an exact
   * location must never reach the client for a creative-access worker.
   */
  locationSensitive?: boolean;
}

/** A missionary with the derived funding figures attached. */
export interface MissionaryWithBudget extends Missionary {
  /** = sum(budget[].amount) */
  monthlyNeed: number;
  /** = round(monthlyNeed * supportGoal / 100) */
  raised: number;
}

/** True when this missionary has any urgent prayer request (→ red pin). */
export function hasUrgentRequest(m: Pick<Missionary, 'prayerRequests'>): boolean {
  return m.prayerRequests.some((r) => r.type === 'urgent');
}
