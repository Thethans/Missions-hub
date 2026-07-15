import { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient.js';
import type { SensitiveRequest } from '../data/types';
import type { AuthState } from '../hooks/useMemberSession';

interface SensitiveBlockProps {
  missionaryId: string;
  /**
   * Public, non-confidential count (see Missionary.sensitiveCount) — decides
   * whether to render this section at all and drives the locked-state copy.
   * The actual text is fetched separately below, never passed as a prop.
   */
  sensitiveCount: number;
  authState: AuthState;
  /** Opens the member login sheet. */
  onSignIn: () => void;
}

/**
 * Members-only confidential prayer requests.
 *
 * The confidential text is fetched here directly from Supabase — never
 * bundled, never passed in as a prop — and the query is only even attempted
 * once `authState === 'verified'`. If it were attempted by a non-member,
 * Postgres row-level security (see supabase/schema.sql) would return zero
 * rows regardless of anything this component does; the client-side
 * `authState` check below is a UX nicety, not the security boundary. See
 * REAL_AUTH_DESIGN.md.
 */
export default function SensitiveBlock({ missionaryId, sensitiveCount, authState, onSignIn }: SensitiveBlockProps) {
  const [items, setItems] = useState<SensitiveRequest[] | null>(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    setItems(null);
    setFetchError(false);
    // sensitiveCount === 0 means there's nothing to fetch — skip the query
    // entirely rather than asking Supabase a question we already know the
    // public (non-confidential) answer to.
    if (authState !== 'verified' || !supabase || sensitiveCount === 0) return;

    let cancelled = false;
    supabase
      .from('missionary_sensitive_requests')
      .select('text')
      .eq('missionary_id', missionaryId)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Failed to load confidential prayer requests:', error);
          setFetchError(true);
          return;
        }
        setItems(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [authState, missionaryId, sensitiveCount]);

  if (sensitiveCount === 0) return null;

  if (authState === 'verified') {
    return (
      <div className="pm-sensitive">
        <h3 className="pm-sec-label pm-sec-label--lock">🔓 Confidential Prayer (Members)</h3>
        {fetchError ? (
          <p className="pm-locked__text">Couldn't load confidential requests right now — try again shortly.</p>
        ) : items === null ? (
          <p className="pm-locked__text">Loading…</p>
        ) : (
          items.map((s, i) => (
            <div key={i} className="pm-sensitive-item">
              <div className="pm-sensitive-item__tag">🔐 Members Only</div>
              <p className="pm-sensitive-item__text">{s.text}</p>
            </div>
          ))
        )}
      </div>
    );
  }

  // 'guest' or 'pending-verification' — the fetch above was never attempted.
  const lockedCopy =
    authState === 'pending-verification'
      ? "Your church hasn't added you to the confidential-prayer list yet. Reach out to your church if you believe this is a mistake."
      : `This missionary has ${sensitiveCount} sensitive prayer request${sensitiveCount > 1 ? 's' : ''} visible only to verified church members.`;

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
          <p className="pm-locked__text">{lockedCopy}</p>
          {authState === 'guest' && (
            <button type="button" className="pm-locked__btn" onClick={onSignIn}>
              🔑 Sign in to view
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
