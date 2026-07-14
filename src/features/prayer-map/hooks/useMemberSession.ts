import { useCallback, useEffect, useRef, useState } from 'react';

// Demo-only member gate. The client-side password check is INTENTIONAL for this
// public prototype so reviewers can exercise the members-only flow without a
// backend. It is NOT real security: the confidential text still ships in the
// bundle and is merely visually gated.
// TODO(real): gate members server-side (e.g. Planning Center OIDC). Confidential
// prayer requests must never be sent to a non-member's browser, and these same
// timeout limits must be enforced on the server session/token — not just here.
const DEMO_MEMBER_PASSWORD = 'member2026';

// Reference uses short values for easy testing (2 min idle / 10 min absolute).
// TODO(real): production would use longer limits (e.g. 15 min idle / 8 hr
// absolute) — or tight values for a public kiosk.
const IDLE_LIMIT_MS = 2 * 60 * 1000; // sign out after 2 min of no interaction
const IDLE_WARN_MS = 30 * 1000; // warn 30s before idle sign-out
const ABSOLUTE_LIMIT_MS = 10 * 60 * 1000; // hard cap after login, regardless of activity

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;

/** A transient session notification. */
export interface SessionToast {
  message: string;
  /** 'warn' → idle warning with a "Stay signed in" action; 'info' → sign-out reason, auto-dismisses. */
  kind: 'warn' | 'info';
}

export interface MemberSession {
  isMember: boolean;
  /** Milliseconds until the absolute session limit — drives the badge countdown. */
  remainingMs: number;
  toast: SessionToast | null;
  /** Verify the demo password; returns whether sign-in succeeded. */
  signIn: (password: string) => boolean;
  /** End the session; an optional reason is shown briefly. */
  signOut: (reason?: string) => void;
  /** Extend the session from the idle warning ("Stay signed in"). */
  extend: () => void;
}

/**
 * Owns the mock member session: the demo password check, the three sign-out
 * triggers (idle, absolute, leave-screen), the live countdown, and the toast
 * state (SPEC §4.12). Signing out flips `isMember`, which re-renders the card
 * and re-locks the sensitive block.
 */
export default function useMemberSession(): MemberSession {
  const [isMember, setIsMember] = useState(false);
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
      setIsMember(false);
      window.clearTimeout(infoToastTimer.current);
      if (reason) {
        setToast({ message: reason, kind: 'info' });
        infoToastTimer.current = window.setTimeout(() => setToast(null), 4000);
      } else {
        setToast(null);
      }
    },
    [clearIdleTimers]
  );

  const resetIdle = useCallback(() => {
    clearIdleTimers();
    // Hide a showing idle warning; leave any other toast untouched (returning
    // the same value makes React bail out, so this is cheap on every mousemove).
    setToast((t) => (t?.kind === 'warn' ? null : t));
    idleWarnTimer.current = window.setTimeout(() => {
      setToast({ message: 'You will be signed out in 30 seconds for security.', kind: 'warn' });
    }, IDLE_LIMIT_MS - IDLE_WARN_MS);
    idleTimer.current = window.setTimeout(() => {
      signOut('You were signed out after 2 minutes of inactivity.');
    }, IDLE_LIMIT_MS);
  }, [clearIdleTimers, signOut]);

  const extend = useCallback(() => {
    setToast(null);
    resetIdle();
  }, [resetIdle]);

  const signIn = useCallback((password: string): boolean => {
    if (password !== DEMO_MEMBER_PASSWORD) return false;
    expiresAtRef.current = Date.now() + ABSOLUTE_LIMIT_MS;
    setRemainingMs(ABSOLUTE_LIMIT_MS);
    setToast(null);
    setIsMember(true);
    return true;
  }, []);

  // All timers + listeners live only while signed in.
  useEffect(() => {
    if (!isMember) return;

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
  }, [isMember, resetIdle, signOut, clearIdleTimers]);

  // Clear the info-toast timer on unmount.
  useEffect(() => () => window.clearTimeout(infoToastTimer.current), []);

  return { isMember, remainingMs, toast, signIn, signOut, extend };
}
