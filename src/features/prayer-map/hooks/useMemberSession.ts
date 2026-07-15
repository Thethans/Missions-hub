import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../../supabaseClient.js';

// Real member gate — see REAL_AUTH_DESIGN.md. Sign-in is a Supabase Auth
// magic-link email (no password), and "signed in" is not the same as
// "verified member": membership is a separate, admin-managed allowlist
// (the `verified_members` table) checked after auth succeeds. Confidential
// prayer text lives in a table RLS actually protects (see SensitiveBlock.tsx)
// — this hook only tracks/display auth state, it is not itself the security
// boundary. That boundary is enforced by Postgres row-level security.
export type AuthState = 'guest' | 'pending-verification' | 'verified';

// Client-side idle/absolute timers are a UX nicety (handy on a shared/kiosk
// device) — not the security boundary. Real enforcement is the Supabase
// project's JWT expiry / refresh-token settings, which should be configured
// to match or be tighter than these values.
const IDLE_LIMIT_MS = 15 * 60 * 1000; // sign out after 15 min of no interaction
const IDLE_WARN_MS = 60 * 1000; // warn 60s before idle sign-out
const ABSOLUTE_LIMIT_MS = 8 * 60 * 60 * 1000; // hard cap: 8 hours after verification

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;

/** A transient session notification. */
export interface SessionToast {
  message: string;
  /** 'warn' → idle warning with a "Stay signed in" action; 'info' → sign-out reason, auto-dismisses. */
  kind: 'warn' | 'info';
}

export interface MemberSession {
  authState: AuthState;
  /** Only meaningful when authState === 'verified'. */
  isAdmin: boolean;
  /** Milliseconds until the absolute session limit — drives the badge countdown. */
  remainingMs: number;
  toast: SessionToast | null;
  /** Sends a magic-link sign-in email. Resolves once the email is sent (or fails) — not once actually signed in; that arrives later via onAuthStateChange. */
  signInWithEmail: (email: string) => Promise<{ sent: boolean; error?: string }>;
  /** End the session; an optional reason is shown briefly. */
  signOut: (reason?: string) => void;
  /** Extend the session from the idle warning ("Stay signed in"). */
  extend: () => void;
}

/**
 * Owns the real member session: Supabase Auth state, the verified_members
 * allowlist check, the three sign-out triggers (idle, absolute,
 * leave-screen), the live countdown, and the toast state. Signing out
 * (or dropping out of `verified_members`) flips `authState`, which
 * re-renders the card and re-locks the sensitive block.
 */
export default function useMemberSession(): MemberSession {
  const [authState, setAuthState] = useState<AuthState>('guest');
  const [isAdmin, setIsAdmin] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [toast, setToast] = useState<SessionToast | null>(null);

  const expiresAtRef = useRef(0);
  const idleTimer = useRef<number | undefined>(undefined);
  const idleWarnTimer = useRef<number | undefined>(undefined);
  const infoToastTimer = useRef<number | undefined>(undefined);

  const clearIdleTimers = useCallback(() => {
    window.clearTimeout(idleTimer.current);
    window.clearTimeout(idleWarnTimer.current);
  }, []);

  const signOut = useCallback(
    (reason?: string) => {
      clearIdleTimers();
      setAuthState('guest');
      setIsAdmin(false);
      window.clearTimeout(infoToastTimer.current);
      if (reason) {
        setToast({ message: reason, kind: 'info' });
        infoToastTimer.current = window.setTimeout(() => setToast(null), 4000);
      } else {
        setToast(null);
      }
      // Actually invalidate the token, not just local UI state — a client
      // sign-out alone wouldn't stop a copied/replayed session token.
      void supabase?.auth.signOut();
    },
    [clearIdleTimers]
  );

  // Looks up whether the signed-in user is on the verified_members
  // allowlist (and not revoked). RLS also enforces this server-side for the
  // actual sensitive-data fetch (see SensitiveBlock.tsx) — this call just
  // drives what the UI shows; it is not itself a security boundary.
  const checkMembership = useCallback(async (userId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('verified_members')
      .select('is_admin, revoked_at')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .maybeSingle();

    if (error) {
      // Fail closed: never assume verified when the check itself failed.
      console.error('Failed to check member verification status:', error);
      setAuthState('pending-verification');
      setIsAdmin(false);
      return;
    }

    if (data) {
      expiresAtRef.current = Date.now() + ABSOLUTE_LIMIT_MS;
      setRemainingMs(ABSOLUTE_LIMIT_MS);
      setIsAdmin(data.is_admin);
      setAuthState('verified');
    } else {
      setIsAdmin(false);
      setAuthState('pending-verification');
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string): Promise<{ sent: boolean; error?: string }> => {
    if (!supabase) return { sent: false, error: 'Sign-in is not configured for this environment.' };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/prayer-map' }
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true };
  }, []);

  const resetIdle = useCallback(() => {
    clearIdleTimers();
    // Hide a showing idle warning; leave any other toast untouched (returning
    // the same value makes React bail out, so this is cheap on every mousemove).
    setToast((t) => (t?.kind === 'warn' ? null : t));
    idleWarnTimer.current = window.setTimeout(() => {
      setToast({ message: 'You will be signed out in 1 minute for security.', kind: 'warn' });
    }, IDLE_LIMIT_MS - IDLE_WARN_MS);
    idleTimer.current = window.setTimeout(() => {
      signOut('You were signed out after 15 minutes of inactivity.');
    }, IDLE_LIMIT_MS);
  }, [clearIdleTimers, signOut]);

  const extend = useCallback(() => {
    setToast(null);
    resetIdle();
  }, [resetIdle]);

  // Picks up an existing session on mount (e.g. returning from the magic-link
  // redirect, or a page refresh) and reacts to sign-in/sign-out events.
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled || !session?.user) return;
      checkMembership(session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user) {
        checkMembership(session.user.id);
      } else {
        setAuthState('guest');
        setIsAdmin(false);
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [checkMembership]);

  // All idle/absolute/leave-screen timers + listeners live only once verified.
  useEffect(() => {
    if (authState !== 'verified') return;

    resetIdle();

    const absolute = window.setTimeout(
      () => signOut('Your session reached its time limit.'),
      Math.max(0, expiresAtRef.current - Date.now())
    );
    const countdown = window.setInterval(() => {
      setRemainingMs(Math.max(0, expiresAtRef.current - Date.now()));
    }, 1000);

    const onActivity = () => resetIdle();
    ACTIVITY_EVENTS.forEach((e) => document.addEventListener(e, onActivity, { passive: true }));

    // Leave-screen sign-out: window blur or the tab becoming hidden.
    const onBlur = () => signOut('You were signed out because you left the page.');
    const onVisibility = () => {
      if (document.hidden) signOut('You were signed out because you left the page.');
    };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearTimeout(absolute);
      window.clearInterval(countdown);
      clearIdleTimers();
      ACTIVITY_EVENTS.forEach((e) => document.removeEventListener(e, onActivity));
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [authState, resetIdle, signOut, clearIdleTimers]);

  // Clear the info-toast timer on unmount.
  useEffect(() => () => window.clearTimeout(infoToastTimer.current), []);

  return { authState, isAdmin, remainingMs, toast, signInWithEmail, signOut, extend };
}
