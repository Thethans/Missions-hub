import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

// Shared getSession()/onAuthStateChange() bootstrap — previously duplicated
// inline in Checklist.jsx and prayer-map's useMemberSession.ts. Returns
// `loading: true` until the initial getSession() resolves; session stays
// `null` for the lifetime of the hook if `supabase` is null (missing env
// vars), matching the null-guard pattern used everywhere else.
export default function useSupabaseSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, loading };
}
