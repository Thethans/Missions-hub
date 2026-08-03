import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

// Reuses prayer-map's verified_members/is_admin table as the site-wide admin
// concept (see supabase/schema.sql's is_active_verified_admin()) rather than
// a hardcoded-UUID check — mirrors the query useMemberSession.ts already
// does for the same table.
//
// Pass `undefined` for `session` while the caller's own session bootstrap
// (e.g. useSupabaseSession) is still resolving, and the real value (a
// session object, or `null` once resolved with no session) once it's done.
// Session starts as `null` in useSupabaseSession before getSession()
// resolves, so if this hook treated a plain `null` as "definitely signed
// out" it would flip isAdmin/loading to their signed-out values on the very
// first render — then, for one render after the real session resolves,
// AdminReviewQueuePage would see that stale isAdmin=false and redirect
// before this hook's own effect (which fires after commit) had a chance to
// re-run with the real session.
export default function useIsAdmin(session) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session === undefined) return;
    if (!supabase || !session) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('verified_members')
      .select('is_admin, revoked_at')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setIsAdmin(Boolean(data?.is_admin && !data?.revoked_at));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  return { isAdmin, loading };
}
