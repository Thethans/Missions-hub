import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

// Looks up which of the two mutually-exclusive support-matching profile
// types (see supabase/schema.sql's prevent_dual_profile_type trigger) the
// signed-in user already has, if any. `profileType` is `undefined` while
// loading, `null` once loaded if neither table has a row, or
// 'missionary' | 'church'.
export default function useAccountProfileType(session) {
  const [profileType, setProfileType] = useState(undefined);

  useEffect(() => {
    if (!supabase || !session) {
      setProfileType(undefined);
      return;
    }
    let cancelled = false;
    const userId = session.user.id;

    Promise.all([
      supabase.from('missionary_profiles').select('id').eq('id', userId).maybeSingle(),
      supabase.from('church_profiles').select('id').eq('id', userId).maybeSingle()
    ]).then(([missionary, church]) => {
      if (cancelled) return;
      if (missionary.data) setProfileType('missionary');
      else if (church.data) setProfileType('church');
      else setProfileType(null);
    });

    return () => {
      cancelled = true;
    };
  }, [session]);

  return profileType;
}
