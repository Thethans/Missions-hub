import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import usePageMeta from '../../hooks/usePageMeta.js';
import { supabase } from '../../supabaseClient.js';
import useMemberSession from './hooks/useMemberSession';
import MemberLoginSheet from './components/sheets/MemberLoginSheet';
import PrototypeBadge from './components/PrototypeBadge';
import './prayer-map.css';

interface VerifiedMemberRow {
  id: string;
  church_email: string;
  is_admin: boolean;
  verified_at: string;
  revoked_at: string | null;
}

interface AccessRequestRow {
  request_user_id: string;
  email: string;
  requested_at: string;
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
  const [requests, setRequests] = useState<AccessRequestRow[] | null>(null);
  const [requestsError, setRequestsError] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

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

  // Anyone who's signed in (via the same magic-link flow Checklist.jsx
  // uses) but has no verified_members row yet — see list_access_requests()
  // in schema.sql. No separate "request access" step: signing in once is
  // enough to show up here, so this can include people who only ever used
  // an unrelated feature like the checklist — harmless, just deny/ignore.
  const loadRequests = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.rpc('list_access_requests');
    if (error) {
      console.error('Failed to load access requests:', error);
      setRequestsError(true);
      return;
    }
    setRequestsError(false);
    setRequests(data ?? []);
  }, []);

  useEffect(() => {
    if (session.authState === 'verified' && session.isAdmin) {
      loadMembers();
      loadRequests();
    }
  }, [session.authState, session.isAdmin, loadMembers, loadRequests]);

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

  // Hard removal — distinct from revoke (soft: sets revoked_at, reversible,
  // keeps history). This drops the row entirely, so it's a one-way action.
  const deleteMember = async (id: string, email: string) => {
    if (!supabase) return;
    if (!window.confirm(`Permanently delete ${email}? This can't be undone.`)) return;
    const { error } = await supabase.from('verified_members').delete().eq('id', id);
    if (error) {
      console.error('Failed to delete member:', error);
      return;
    }
    loadMembers();
  };

  // Already have this request's user_id (unlike the manual add-by-email
  // form above, which leaves user_id null until that email's first sign-in)
  // since list_access_requests() only surfaces people who've already signed in.
  const acceptRequest = async (userId: string, email: string) => {
    if (!supabase) return;
    setActioningId(userId);
    const { error } = await supabase.from('verified_members').insert({
      church_email: email,
      user_id: userId,
      verified_at: new Date().toISOString()
    });
    setActioningId(null);
    if (error) {
      console.error('Failed to accept access request:', error);
      return;
    }
    loadMembers();
    loadRequests();
  };

  // Permanently blocks this email from reappearing in the request queue —
  // see denied_access_requests in schema.sql. Reconsidering a denied email
  // later needs a direct SQL delete from that table; no undo UI for now.
  const denyRequest = async (userId: string, email: string) => {
    if (!supabase) return;
    setActioningId(userId);
    const { error } = await supabase.from('denied_access_requests').insert({ email });
    setActioningId(null);
    if (error) {
      console.error('Failed to deny access request:', error);
      return;
    }
    loadRequests();
  };

  if (session.authState === 'guest') {
    return (
      <div className="pm-page">
        <section className="page-hero page-hero--compact">
          <h1>Verified members</h1>
          <p>Sign in to manage who can see confidential prayer requests.</p>
          <PrototypeBadge />
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
          <PrototypeBadge />
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
          <PrototypeBadge />
        </section>
      </div>
    );
  }

  return (
    <div className="pm-page">
      <section className="page-hero page-hero--compact">
        <h1>Verified members</h1>
        <p>Manage who can see confidential prayer requests on the missionary support map.</p>
        <PrototypeBadge />
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

        <h2 className="pm-admin-subheading">Access requests</h2>
        {requestsError && (
          <p className="pm-login-error" role="alert">
            Couldn't load access requests right now — try refreshing.
          </p>
        )}
        {requests === null ? (
          <p>Loading…</p>
        ) : requests.length === 0 ? (
          <p>No pending access requests.</p>
        ) : (
          <table className="pm-admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Requested</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.request_user_id}>
                  <td>{r.email}</td>
                  <td>{new Date(r.requested_at).toLocaleDateString()}</td>
                  <td className="pm-admin-actions">
                    <button
                      type="button"
                      className="pm-admin-accept"
                      disabled={actioningId === r.request_user_id}
                      onClick={() => acceptRequest(r.request_user_id, r.email)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="pm-admin-deny"
                      disabled={actioningId === r.request_user_id}
                      onClick={() => denyRequest(r.request_user_id, r.email)}
                    >
                      Deny
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className="pm-admin-subheading">Verified members</h2>
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
                  <td className="pm-admin-actions">
                    {!m.revoked_at && (
                      <button type="button" className="pm-admin-revoke" onClick={() => revokeMember(m.id)}>
                        Revoke
                      </button>
                    )}
                    <button
                      type="button"
                      className="pm-admin-delete"
                      onClick={() => deleteMember(m.id, m.church_email)}
                    >
                      Delete
                    </button>
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
