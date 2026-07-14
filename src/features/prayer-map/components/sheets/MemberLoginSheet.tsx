import { useEffect, useRef, useState } from 'react';
import BottomSheet from './BottomSheet';

interface MemberLoginSheetProps {
  open: boolean;
  onClose: () => void;
  /** Verify the password; returns whether sign-in succeeded. */
  onSubmit: (password: string) => boolean;
}

/**
 * MOCK member login. Verifies a typed password against a demo constant in the
 * browser — see the security note in useMemberSession.
 * TODO(real): authenticate against the church directory server-side (Planning
 * Center OIDC); never verify membership in the client.
 */
export default function MemberLoginSheet({ open, onClose, onSubmit }: MemberLoginSheetProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const passwordRef = useRef<HTMLInputElement | null>(null);

  // Reset fields whenever the sheet opens, and focus the password field.
  useEffect(() => {
    if (open) {
      setPassword('');
      setError(false);
      const t = window.setTimeout(() => passwordRef.current?.focus(), 100);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onSubmit(password);
    if (!ok) {
      setError(true);
      setPassword('');
      passwordRef.current?.focus();
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} label="Member sign in">
      <div className="pm-login-icon" aria-hidden="true">
        🔐
      </div>
      <h2 className="pm-sheet__title">Member Sign In</h2>
      <p className="pm-sheet__sub">
        Verify against the church membership directory to view confidential prayer requests.
      </p>

      {error && (
        <p className="pm-login-error" role="alert">
          That password didn’t match our directory. Please try again.
        </p>
      )}

      <form onSubmit={submit}>
        <label className="pm-login-field">
          <span>Member Email</span>
          {/* Prefilled for the demo; not actually checked. */}
          <input className="pm-login-input" type="email" defaultValue="member@gracechurch.org" />
        </label>
        <label className="pm-login-field">
          <span>Directory Password</span>
          <input
            ref={passwordRef}
            className="pm-login-input"
            type="password"
            placeholder="Enter your member password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <p className="pm-login-hint">
          🧪 <b>Prototype demo:</b> use password <b>member2026</b> to simulate a verified member. In
          the live site this checks your real church directory, not a password typed here.
        </p>

        <button type="submit" className="pm-login-btn">
          🔑 Sign In
        </button>
        <button type="button" className="pm-login-cancel" onClick={onClose}>
          Cancel
        </button>
      </form>

      <p className="pm-login-note">
        Powered by your church’s membership directory. Confidential requests are never shown on the
        public page.
      </p>
    </BottomSheet>
  );
}
