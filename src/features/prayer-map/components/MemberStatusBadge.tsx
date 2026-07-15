import type { AuthState } from '../hooks/useMemberSession';

interface MemberStatusBadgeProps {
  authState: AuthState;
  remainingMs: number;
  onSignOut: () => void;
}

function formatRemaining(ms: number): string {
  const total = Math.round(Math.max(0, ms) / 1000);
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${mm}:${ss < 10 ? '0' : ''}${ss}`;
}

/**
 * Top-right session pill. Guests see a muted "Guest view"; someone signed in
 * but not yet on the church's verified list sees a distinct pending state
 * (see REAL_AUTH_DESIGN.md — signed in isn't the same as verified); verified
 * members see a bright badge with a live countdown to the absolute limit and
 * a prominent Sign-out button (SPEC §4.12).
 */
export default function MemberStatusBadge({ authState, remainingMs, onSignOut }: MemberStatusBadgeProps) {
  if (authState === 'guest') {
    return (
      <div className="pm-status pm-status--guest">
        <span>Guest view</span>
      </div>
    );
  }

  if (authState === 'pending-verification') {
    return (
      <div className="pm-status pm-status--pending">
        <span className="pm-status__label">🕓 Signed in — pending verification</span>
        <button type="button" className="pm-status__signout" onClick={onSignOut}>
          🔒 Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="pm-status pm-status--member">
      <span className="pm-status__label">
        🔓 Member
        <span className="pm-status__timer" title="Session time remaining">
          {formatRemaining(remainingMs)}
        </span>
      </span>
      <button type="button" className="pm-status__signout" onClick={onSignOut}>
        🔒 Sign out
      </button>
    </div>
  );
}
