interface MemberStatusBadgeProps {
  isMember: boolean;
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
 * Top-right session pill. Guests see a muted "Guest view"; members see a bright
 * badge with a live countdown to the absolute limit and a prominent Sign-out
 * button (SPEC §4.12).
 */
export default function MemberStatusBadge({ isMember, remainingMs, onSignOut }: MemberStatusBadgeProps) {
  if (!isMember) {
    return (
      <div className="pm-status pm-status--guest">
        <span>Guest view</span>
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
