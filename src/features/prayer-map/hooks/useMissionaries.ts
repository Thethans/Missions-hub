import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient.js';
import { missionaries as staticMissionaries } from '../data/missionaries';
import type { Missionary } from '../data/types';

interface MissionaryRow {
  id: string;
  name: string;
  name_note: string | null;
  location: string;
  photo: string | null;
  photo_width: number | null;
  photo_height: number | null;
  lat: number;
  lng: number;
  role: string;
  ministry: string;
  prayer_count: number;
  support_goal: number;
  budget: Missionary['budget'];
  prayer_requests: Missionary['prayerRequests'];
  sensitive_count: number;
  updates: Missionary['updates'];
  location_sensitive: boolean;
}

function fromRow(row: MissionaryRow): Missionary {
  return {
    id: row.id,
    name: row.name,
    nameNote: row.name_note ?? undefined,
    location: row.location,
    photo: row.photo ?? undefined,
    photoWidth: row.photo_width ?? undefined,
    photoHeight: row.photo_height ?? undefined,
    lat: row.lat,
    lng: row.lng,
    role: row.role,
    ministry: row.ministry,
    prayerCount: row.prayer_count,
    supportGoal: row.support_goal,
    budget: row.budget,
    prayerRequests: row.prayer_requests,
    sensitiveCount: row.sensitive_count,
    updates: row.updates,
    locationSensitive: row.location_sensitive
  };
}

/**
 * Missionary records now live in Supabase (Stage 2 of REAL_AUTH_DESIGN.md —
 * admin-editable via /prayer-map/admin, see AdminMissionaries.tsx), not the
 * old hardcoded data/missionaries.ts. That file still exists and is used
 * as the fallback here: if supabase is null (missing env vars, same guard
 * pattern as Checklist.jsx) or the fetch fails, the map still renders
 * something instead of going blank.
 */
export default function useMissionaries(): { missionaries: Missionary[]; loading: boolean; error: boolean } {
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!supabase) {
        if (!cancelled) {
          setMissionaries(staticMissionaries);
          setLoading(false);
        }
        return;
      }

      const { data, error: fetchError } = await supabase.from('missionaries').select('*').order('name');
      if (cancelled) return;

      if (fetchError || !data || data.length === 0) {
        if (fetchError) console.error('Failed to load missionaries:', fetchError);
        setMissionaries(staticMissionaries);
        setError(Boolean(fetchError));
        setLoading(false);
        return;
      }

      setMissionaries((data as MissionaryRow[]).map(fromRow));
      setError(false);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { missionaries, loading, error };
}
