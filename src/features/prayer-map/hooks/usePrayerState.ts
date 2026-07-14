import { useCallback, useState } from 'react';

export interface PrayerState {
  /** Whether the viewer has toggled "I'm praying" for this missionary. */
  isPraying: (id: string) => boolean;
  /** Toggle the praying state for a missionary. */
  toggle: (id: string) => void;
  /** Base count plus the optimistic +1 if currently praying. */
  countFor: (id: string, baseCount: number) => number;
}

/**
 * Per-missionary "I'm praying" toggles with an optimistic count delta (SPEC
 * §4.9). Local-only; nothing is persisted.
 * TODO(real): record prayer events server-side and derive counts from them.
 */
export default function usePrayerState(): PrayerState {
  const [prayed, setPrayed] = useState<Set<string>>(() => new Set());

  const toggle = useCallback((id: string) => {
    setPrayed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isPraying = useCallback((id: string) => prayed.has(id), [prayed]);

  const countFor = useCallback((id: string, baseCount: number) => baseCount + (prayed.has(id) ? 1 : 0), [prayed]);

  return { isPraying, toggle, countFor };
}
