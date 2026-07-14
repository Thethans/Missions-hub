import type { Missionary } from '../data/types';
import { hasUrgentRequest } from '../data/types';

/**
 * Short label shown under a pin — the surname (last word of the name), which is
 * recognizable for both couples ("Smith") and individuals ("Chen").
 */
export function shortName(m: Pick<Missionary, 'name'>): string {
  const parts = m.name.trim().split(/\s+/);
  return parts[parts.length - 1] ?? m.name;
}

/**
 * Builds the DOM element for a single map pin. This is a plain element (not a
 * React render) because MapLibre owns the markers directly — they're created
 * once and never rebuilt on React re-render (see PrayerWorldMap), which keeps
 * the map performant per SPEC §6.
 *
 * Urgent missionaries (any `type: 'urgent'` request) get the red pulsing state;
 * everyone else pulses teal.
 */
export function createMissionaryPinElement(m: Missionary, onSelect: (id: string) => void): HTMLButtonElement {
  const urgent = hasUrgentRequest(m);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = urgent ? 'pm-pin pm-pin--urgent' : 'pm-pin';
  button.setAttribute(
    'aria-label',
    `${m.name} — ${m.location}${urgent ? ' (urgent prayer request)' : ''}`
  );

  const ring = document.createElement('span');
  ring.className = 'pm-pin__ring';
  ring.setAttribute('aria-hidden', 'true');

  const dot = document.createElement('span');
  dot.className = 'pm-pin__dot';
  dot.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'pm-pin__label';
  label.textContent = shortName(m);

  button.append(ring, dot, label);
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelect(m.id);
  });

  return button;
}

/**
 * Builds the DOM element for a "creative access" missionary — deliberately a
 * soft, oversized, blurred area rather than a precise pin, and with no name
 * label, so the map only ever communicates "somewhere in this broad region,"
 * never an exact point. Pairs with `Missionary.locationSensitive` — see the
 * security notes there and in missionaries.ts.
 *
 * Still reuses the urgent/normal color split (urgent requests matter for
 * prayer even when the exact location can't be shown), and stays clickable
 * anywhere across its larger hit area to open the card.
 */
export function createApproximatePinElement(m: Missionary, onSelect: (id: string) => void): HTMLButtonElement {
  const urgent = hasUrgentRequest(m);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = urgent ? 'pm-pin-area pm-pin-area--urgent' : 'pm-pin-area';
  button.setAttribute(
    'aria-label',
    `A missionary serving in a creative-access country — exact location withheld for security${urgent ? ' (urgent prayer request)' : ''}`
  );

  const halo = document.createElement('span');
  halo.className = 'pm-pin-area__halo';
  halo.setAttribute('aria-hidden', 'true');

  const ring = document.createElement('span');
  ring.className = 'pm-pin-area__ring';
  ring.setAttribute('aria-hidden', 'true');

  const icon = document.createElement('span');
  icon.className = 'pm-pin-area__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '🔒';

  button.append(halo, ring, icon);
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    onSelect(m.id);
  });

  return button;
}
