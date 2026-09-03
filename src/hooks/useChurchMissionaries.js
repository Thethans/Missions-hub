import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient.js';

// Shared data source for the card/map/globe views of a church's private
// missionary directory (see the church-private missionary directory schema
// in supabase/schema.sql). Joins church_missionaries -> church_missionary_
// profiles for the roster, then attaches each missionary's current prayer
// need, past prayer needs (for the "past needs" disclosure), and most
// recent media update — the shape every view needs, so the three view
// components differ only in rendering, not data-fetching.
//
// `missionaries` is `[]` while loading or on error; check `loading`/`error`
// to tell "no data yet" apart from "no missionaries added to this church".
export default function useChurchMissionaries(churchId) {
  const [missionaries, setMissionaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refresh = useCallback(() => setRefreshIndex((n) => n + 1), []);

  useEffect(() => {
    if (!supabase || !churchId) {
      setMissionaries([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    supabase
      .from('church_missionaries')
      .select('missionary_id, church_missionary_profiles(*)')
      .eq('church_id', churchId)
      .then(async ({ data: roster, error: rosterError }) => {
        if (cancelled) return;
        if (rosterError) {
          setError(rosterError.message);
          setMissionaries([]);
          setLoading(false);
          return;
        }

        const profiles = (roster ?? [])
          .map((row) => row.church_missionary_profiles)
          .filter(Boolean);
        const missionaryIds = profiles.map((p) => p.id);

        if (missionaryIds.length === 0) {
          setMissionaries([]);
          setLoading(false);
          return;
        }

        const [needsResult, mediaResult] = await Promise.all([
          supabase
            .from('prayer_needs')
            .select('*')
            .in('missionary_id', missionaryIds)
            .order('posted_at', { ascending: false }),
          supabase
            .from('media_updates')
            .select('*')
            .in('missionary_id', missionaryIds)
            .order('posted_at', { ascending: false })
        ]);

        if (cancelled) return;

        if (needsResult.error || mediaResult.error) {
          setError((needsResult.error || mediaResult.error).message);
          setMissionaries([]);
          setLoading(false);
          return;
        }

        // Most-recent-first order (the query above) means the first
        // is_current row seen per missionary is the one to surface; any
        // other need for that missionary — is_current or not — becomes a
        // "past" entry, so a stale is_current=true row left over from
        // before a newer one was posted doesn't show up twice.
        const currentNeedByMissionary = new Map();
        const pastNeedsByMissionary = new Map();
        for (const need of needsResult.data ?? []) {
          if (need.is_current && !currentNeedByMissionary.has(need.missionary_id)) {
            currentNeedByMissionary.set(need.missionary_id, need);
            continue;
          }
          if (!pastNeedsByMissionary.has(need.missionary_id)) {
            pastNeedsByMissionary.set(need.missionary_id, []);
          }
          pastNeedsByMissionary.get(need.missionary_id).push(need);
        }

        const latestMediaByMissionary = new Map();
        for (const media of mediaResult.data ?? []) {
          if (!latestMediaByMissionary.has(media.missionary_id)) {
            latestMediaByMissionary.set(media.missionary_id, media);
          }
        }

        setMissionaries(
          profiles.map((profile) => ({
            ...profile,
            currentPrayerNeed: currentNeedByMissionary.get(profile.id) ?? null,
            pastPrayerNeeds: pastNeedsByMissionary.get(profile.id) ?? [],
            latestMediaUpdate: latestMediaByMissionary.get(profile.id) ?? null
          }))
        );
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [churchId, refreshIndex]);

  return { missionaries, loading, error, refresh };
}
