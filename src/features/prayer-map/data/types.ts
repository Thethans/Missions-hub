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
