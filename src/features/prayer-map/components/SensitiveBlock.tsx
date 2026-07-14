import type { SensitiveRequest } from '../data/types';

interface SensitiveBlockProps {
  sensitive: SensitiveRequest[];
  /** Whether the current viewer is a signed-in member. */
  isMember: boolean;
  /** Opens the member login sheet (wired in the session phase). */
  onSignIn: () => void;
}

/**
 * Members-only confidential prayer requests.
 *
 * SECURITY NOTE: in this demo the confidential text is present in the client
 * bundle and merely visually gated — acceptable ONLY because this is a public
 * prototype with fictional data. In production the sensitive fields must never
 * be sent to a non-member's browser; gating has to happen server-side.
 * TODO(real): fetch these only after a server-verified member session.
 */
export default function SensitiveBlock({ sensitive, isMember, onSignIn }: SensitiveBlockProps) {
  if (sensitive.length === 0) return null;

  if (isMember) {
    return (
      <div className="pm-sensitive">
        <h3 className="pm-sec-label pm-sec-label--lock">🔓 Confidential Prayer (Members)</h3>
        {sensitive.map((s, i) => (
          <div key={i} className="pm-sensitive-item">
            <div className="pm-sensitive-item__tag">🔐 Members Only</div>
            <p className="pm-sensitive-item__text">{s.text}</p>
          </div>
        ))}
      </div>
    );
  }

  const count = sensitive.length;
  return (
    <div className="pm-sensitive">
      <h3 className="pm-sec-label pm-sec-label--lock">🔒 Confidential Prayer (Members)</h3>
      <div className="pm-locked">
        <div className="pm-locked__blur" aria-hidden="true">
          <span className="pm-locked__line pm-locked__line--w95" />
          <span className="pm-locked__line pm-locked__line--w80" />
          <span className="pm-locked__line pm-locked__line--w95" />
          <span className="pm-locked__line pm-locked__line--w60" />
        </div>
        <div className="pm-locked__overlay">
          <div className="pm-locked__icon" aria-hidden="true">
            🔒
          </div>
          <p className="pm-locked__text">
            This missionary has {count} sensitive prayer request{count > 1 ? 's' : ''} visible only
            to verified church members.
          </p>
          <button type="button" className="pm-locked__btn" onClick={onSignIn}>
            🔑 Sign in to view
          </button>
        </div>
      </div>
    </div>
  );
}
