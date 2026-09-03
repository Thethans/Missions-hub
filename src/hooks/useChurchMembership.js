import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

// Looks up the signed-in user's role in one specific church, from
// church_members (see supabase/schema.sql). `role` is `undefined` while
// loading, `null` once loaded if the user has no membership row for this
// church, or 'admin' | 'member'. This is a UX nicety on top of the real
// boundary — the church_members/church_missionary_profiles RLS policies —
// same framing as useIsAdmin.js.
//
// Pass `undefined` for `session` while the caller's own session bootstrap
// is still resolving, matching useIsAdmin's convention.
export default function useChurchMembership(session, churchId) {
  const [role, setRole] = useState(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session === undefined) return;
    if (!supabase || !session || !churchId) {
      setRole(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('church_members')
      .select('role')
      .eq('church_id', churchId)
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setRole(data?.role ?? null);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session, churchId]);

  return { role, loading };
}
