import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import usePageMeta from '../../hooks/usePageMeta.js';
import { supabase } from '../../supabaseClient.js';
import useMemberSession from './hooks/useMemberSession';
import MemberLoginSheet from './components/sheets/MemberLoginSheet';
import './prayer-map.css';

interface VerifiedMemberRow {
  id: string;
  church_email: string;
  is_admin: boolean;
  verified_at: string;
  revoked_at: string | null;
}

// Route entry for /prayer-map/admin — not linked from the main nav (see
// REAL_AUTH_DESIGN.md). Manages the verified_members allowlist that gates
// confidential prayer text; the real write boundary is the RLS insert/update
// policies in supabase/schema.sql, which reject a non-admin's write
// regardless of what this page shows them — the authState/isAdmin checks
// below are a UX nicety on top of that, not the security boundary.
export default function AdminPage() {
  const session = useMemberSession();
  const [loginOpen, setLoginOpen] = useState(false);
  const [members, setMembers] = useState<VerifiedMemberRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  usePageMeta({
    title: 'Verified Members',
    description: 'Manage who can see confidential prayer requests on the missionary support map.',
    path: '/prayer-map/admin'
  });

  const loadMembers = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('verified_members')
      .select('id, church_email, is_admin, verified_at, revoked_at')
      .order('verified_at', { ascending: false });
    if (error) {
      console.error('Failed to load verified members:', error);
      setLoadError(true);
      return;
    }
    setLoadError(false);
    setMembers(data ?? []);
  }, []);

  useEffect(() => {
    if (session.authState === 'verified' && session.isAdmin) {
      loadMembers();
    }
  }, [session.authState, session.isAdmin, loadMembers]);

  const addMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setAdding(true);
    setAddError(null);
    const { error } = await supabase.from('verified_members').insert({ church_email: newEmail });
    setAdding(false);
    if (error) {
      setAddError(error.message);
      return;
    }
    setNewEmail('');
    loadMembers();
  };

  const revokeMember = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from('verified_members')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      console.error('Failed to revoke member:', error);
      return;
    }
    loadMembers();
  };

  if (session.authState === 'guest') {
    return (
      <div className="pm-page">
        <section className="page-hero page-hero--compact">
          <h1>Verified members</h1>
          <p>Sign in to manage who can see confidential prayer requests.</p>
        </section>
        <div className="pm-admin-body">
          <button type="button" className="pm-login-btn pm-admin-signin" onClick={() => setLoginOpen(true)}>
            🔑 Sign in
          </button>
        </div>
        <MemberLoginSheet
          open={loginOpen}
          onClose={() => setLoginOpen(false)}
          onSubmit={(email) => session.signInWithEmail(email)}
        />
      </div>
    );
  }

  if (session.authState === 'pending-verification') {
    return (
      <div className="pm-page">
        <section className="page-hero page-hero--compact">
          <h1>Verified members</h1>
          <p>Your email isn't on the verified list yet — an existing admin needs to add you first.</p>
        </section>
      </div>
    );
  }

  if (!session.isAdmin) {
    return (
      <div className="pm-page">
        <section className="page-hero page-hero--compact">
          <h1>Verified members</h1>
          <p>You're a verified member, but not an admin — you don't have access to manage this list.</p>
        </section>
      </div>
    );
  }

  return (
    <div className="pm-page">
      <section className="page-hero page-hero--compact">
        <h1>Verified members</h1>
        <p>Manage who can see confidential prayer requests on the missionary support map.</p>
      </section>

      <div className="pm-admin-body">
        <form className="pm-admin-add" onSubmit={addMember}>
          <input
            type="email"
            required
            placeholder="new-member@yourchurch.org"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            aria-label="New member email"
          />
          <button type="submit" disabled={adding}>
            {adding ? 'Adding…' : 'Add member'}
          </button>
        </form>
        {addError && (
          <p className="pm-login-error" role="alert">
            {addError}
          </p>
        )}

        {loadError && (
          <p className="pm-login-error" role="alert">
            Couldn't load the member list right now — try refreshing.
          </p>
        )}

        {members === null ? (
          <p>Loading…</p>
        ) : members.length === 0 ? (
          <p>No verified members yet.</p>
        ) : (
          <table className="pm-admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Admin</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td>{m.church_email}</td>
                  <td>{m.is_admin ? 'Yes' : ''}</td>
                  <td>{m.revoked_at ? 'Revoked' : 'Active'}</td>
                  <td>
                    {!m.revoked_at && (
                      <button type="button" className="pm-admin-revoke" onClick={() => revokeMember(m.id)}>
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
