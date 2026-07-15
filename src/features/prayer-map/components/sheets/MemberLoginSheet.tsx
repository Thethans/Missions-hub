import { useEffect, useRef, useState } from 'react';
import BottomSheet from './BottomSheet';

interface MemberLoginSheetProps {
  open: boolean;
  onClose: () => void;
  /** Sends the magic-link email; resolves once it's sent (or fails) — not once actually signed in. */
  onSubmit: (email: string) => Promise<{ sent: boolean; error?: string }>;
}

/**
 * Real member sign-in: a Supabase Auth magic-link email, no password —
 * mirrors Checklist.jsx's SignInForm so this feature doesn't introduce a
 * second auth mechanism. Being signed in isn't the same as being a verified
 * member (see REAL_AUTH_DESIGN.md): this sheet only covers proving email
 * ownership. Membership itself is checked separately once the magic-link
 * redirect completes, via the verified_members allowlist.
 */
export default function MemberLoginSheet({ open, onClose, onSubmit }: MemberLoginSheetProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const emailRef = useRef<HTMLInputElement | null>(null);

  // Reset fields whenever the sheet opens, and focus the email field.
  useEffect(() => {
    if (open) {
      setEmail('');
      setError(null);
      setSending(false);
      setSent(false);
      const t = window.setTimeout(() => emailRef.current?.focus(), 100);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);
    const result = await onSubmit(email);
    setSending(false);
    if (result.sent) {
      setSent(true);
    } else {
      setError(result.error || "Something went wrong sending your sign-in link. Please try again.");
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} label="Member sign in">
      <div className="pm-login-icon" aria-hidden="true">
        🔐
      </div>
      <h2 className="pm-sheet__title">Member Sign In</h2>
      <p className="pm-sheet__sub">
        Sign in with your email to view confidential prayer requests — we'll send a link, no
        password needed.
      </p>

      {sent ? (
        <div className="pm-login-sent">
          <p>
            Check your email — we sent a sign-in link to <strong>{email}</strong>. Click it to
            finish signing in.
          </p>
          <button type="button" className="pm-login-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      ) : (
        <form onSubmit={submit}>
          {error && (
            <p className="pm-login-error" role="alert">
              {error}
            </p>
          )}
          <label className="pm-login-field">
            <span>Email</span>
            <input
              ref={emailRef}
              className="pm-login-input"
              type="email"
              placeholder="you@yourchurch.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <p className="pm-login-hint">
            🔒 Signing in proves it's really your inbox. Whether you can see confidential requests
            depends on your church having added your email to the verified list — if they haven't
            yet, you'll see a note asking you to reach out.
          </p>

          <button type="submit" className="pm-login-btn" disabled={sending}>
            {sending ? 'Sending…' : '🔑 Send Sign-In Link'}
          </button>
          <button type="button" className="pm-login-cancel" onClick={onClose}>
            Cancel
          </button>
        </form>
      )}

      <p className="pm-login-note">
        Powered by your church's membership list. Confidential requests are never shown on the
        public page.
      </p>
    </BottomSheet>
  );
}
