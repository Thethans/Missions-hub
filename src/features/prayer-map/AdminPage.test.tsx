import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminPage from './AdminPage';

// AdminPage now renders PrototypeBadge, which uses <Link> — needs a Router
// context, hence MemoryRouter here (matching MapPage.test.jsx's pattern).
function renderAdminPage() {
  return render(
    <MemoryRouter>
      <AdminPage />
    </MemoryRouter>
  );
}

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

// Mirrors the small slice of MemberSession AdminPage actually reads —
// session state itself is covered separately in useMemberSession.test.ts.
let mockSession: {
  authState: 'guest' | 'pending-verification' | 'verified';
  isAdmin: boolean;
  signInWithEmail: ReturnType<typeof vi.fn>;
} = {
  authState: 'guest',
  isAdmin: false,
  signInWithEmail: vi.fn(() => Promise.resolve({ sent: true }))
};

vi.mock('./hooks/useMemberSession', () => ({
  default: () => mockSession
}));

let membersData: VerifiedMemberRow[] | null = [];
let membersError: { message: string } | null = null;
let requestsData: AccessRequestRow[] | null = [];
let requestsError: { message: string } | null = null;
let insertError: { message: string } | null = null;
let updateError: { message: string } | null = null;
let deleteError: { message: string } | null = null;
let denyInsertError: { message: string } | null = null;

const insertSpy = vi.fn();
const updateSpy = vi.fn();
const deleteSpy = vi.fn();
const denyInsertSpy = vi.fn();
const rpcSpy = vi.fn();

let mockSupabase: unknown = null;

vi.mock('../../supabaseClient.js', () => ({
  get supabase() {
    return mockSupabase;
  }
}));

function buildSupabaseMock() {
  return {
    from: (table: string) => {
      if (table === 'verified_members') {
        return {
          select: () => ({
            order: () =>
              Promise.resolve(
                membersError ? { data: null, error: membersError } : { data: membersData, error: null }
              )
          }),
          insert: (payload: unknown) => {
            insertSpy(payload);
            return Promise.resolve({ error: insertError });
          },
          update: (payload: unknown) => ({
            eq: (col: string, val: string) => {
              updateSpy(payload, col, val);
              return Promise.resolve({ error: updateError });
            }
          }),
          delete: () => ({
            eq: (col: string, val: string) => {
              deleteSpy(col, val);
              return Promise.resolve({ error: deleteError });
            }
          })
        };
      }
      if (table === 'denied_access_requests') {
        return {
          insert: (payload: unknown) => {
            denyInsertSpy(payload);
            return Promise.resolve({ error: denyInsertError });
          }
        };
      }
      throw new Error(`Unexpected table in test: ${table}`);
    },
    rpc: (fn: string) => {
      rpcSpy(fn);
      return Promise.resolve(
        requestsError ? { data: null, error: requestsError } : { data: requestsData, error: null }
      );
    }
  };
}

describe('AdminPage', () => {
  beforeEach(() => {
    mockSession = {
      authState: 'guest',
      isAdmin: false,
      signInWithEmail: vi.fn(() => Promise.resolve({ sent: true }))
    };
    membersData = [];
    membersError = null;
    requestsData = [];
    requestsError = null;
    insertError = null;
    updateError = null;
    deleteError = null;
    denyInsertError = null;
    insertSpy.mockClear();
    updateSpy.mockClear();
    deleteSpy.mockClear();
    denyInsertSpy.mockClear();
    rpcSpy.mockClear();
    mockSupabase = buildSupabaseMock();
  });

  it('shows a sign-in prompt for a guest, and never touches supabase', () => {
    renderAdminPage();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  it('shows a distinct message for pending-verification, with no admin content', () => {
    mockSession.authState = 'pending-verification';
    renderAdminPage();
    expect(screen.getByText(/isn't on the verified list yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/access requests/i)).not.toBeInTheDocument();
  });

  it('shows an access-denied message for a verified non-admin, and never loads member data', () => {
    mockSession.authState = 'verified';
    mockSession.isAdmin = false;
    renderAdminPage();
    expect(screen.getByText(/verified member, but not an admin/i)).toBeInTheDocument();
    expect(rpcSpy).not.toHaveBeenCalled();
  });

  describe('as an admin', () => {
    beforeEach(() => {
      mockSession.authState = 'verified';
      mockSession.isAdmin = true;
    });

    it('loads and displays both the member list and the access-request queue', async () => {
      membersData = [
        { id: 'm1', church_email: 'jane@church.org', is_admin: false, verified_at: '2026-01-01', revoked_at: null }
      ];
      requestsData = [{ request_user_id: 'u1', email: 'newcomer@example.com', requested_at: '2026-02-01' }];

      renderAdminPage();

      expect(await screen.findByText('jane@church.org')).toBeInTheDocument();
      expect(screen.getByText('newcomer@example.com')).toBeInTheDocument();
      expect(rpcSpy).toHaveBeenCalledWith('list_access_requests');
    });

    it('shows empty-state copy when both lists are empty', async () => {
      renderAdminPage();
      expect(await screen.findByText(/no verified members yet/i)).toBeInTheDocument();
      expect(screen.getByText(/no pending access requests/i)).toBeInTheDocument();
    });

    it('shows an error message if loading members fails', async () => {
      membersError = { message: 'boom' };
      renderAdminPage();
      expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load the member list/i);
    });

    it('shows an error message if loading access requests fails', async () => {
      requestsError = { message: 'boom' };
      renderAdminPage();
      expect(await screen.findByText(/couldn't load access requests/i)).toBeInTheDocument();
    });

    it('adds a new member through the form and reloads the list', async () => {
      const user = userEvent.setup();
      renderAdminPage();
      await screen.findByText(/no verified members yet/i);

      await user.type(screen.getByLabelText(/new member email/i), 'new@church.org');
      await user.click(screen.getByRole('button', { name: /add member/i }));

      await waitFor(() => expect(insertSpy).toHaveBeenCalledWith({ church_email: 'new@church.org' }));
    });

    it('shows an error if adding a member fails', async () => {
      insertError = { message: 'church_email already exists' };
      const user = userEvent.setup();
      renderAdminPage();
      await screen.findByText(/no verified members yet/i);

      await user.type(screen.getByLabelText(/new member email/i), 'dupe@church.org');
      await user.click(screen.getByRole('button', { name: /add member/i }));

      expect(await screen.findByText(/church_email already exists/i)).toBeInTheDocument();
    });

    it('shows Revoke only for an active member, not a revoked one', async () => {
      membersData = [
        { id: 'active', church_email: 'active@church.org', is_admin: false, verified_at: 't', revoked_at: null },
        {
          id: 'revoked',
          church_email: 'revoked@church.org',
          is_admin: false,
          verified_at: 't',
          revoked_at: '2026-01-01'
        }
      ];
      renderAdminPage();
      await screen.findByText('active@church.org');

      const revokeButtons = screen.getAllByRole('button', { name: /^revoke$/i });
      expect(revokeButtons).toHaveLength(1);
      // Delete is offered for both, regardless of revoked status.
      expect(screen.getAllByRole('button', { name: /^delete$/i })).toHaveLength(2);
    });

    it('revokes an active member', async () => {
      membersData = [
        { id: 'm1', church_email: 'jane@church.org', is_admin: false, verified_at: 't', revoked_at: null }
      ];
      const user = userEvent.setup();
      renderAdminPage();
      await screen.findByText('jane@church.org');

      await user.click(screen.getByRole('button', { name: /^revoke$/i }));

      await waitFor(() => expect(updateSpy).toHaveBeenCalledWith({ revoked_at: expect.any(String) }, 'id', 'm1'));
    });

    it('deletes a member after confirming', async () => {
      membersData = [
        { id: 'm1', church_email: 'jane@church.org', is_admin: false, verified_at: 't', revoked_at: null }
      ];
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const user = userEvent.setup();
      renderAdminPage();
      await screen.findByText('jane@church.org');

      await user.click(screen.getByRole('button', { name: /^delete$/i }));

      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('jane@church.org'));
      await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith('id', 'm1'));
    });

    it('does not delete a member if the confirmation is cancelled', async () => {
      membersData = [
        { id: 'm1', church_email: 'jane@church.org', is_admin: false, verified_at: 't', revoked_at: null }
      ];
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      const user = userEvent.setup();
      renderAdminPage();
      await screen.findByText('jane@church.org');

      await user.click(screen.getByRole('button', { name: /^delete$/i }));

      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('accepts an access request, inserting it with the already-known user_id', async () => {
      requestsData = [{ request_user_id: 'u1', email: 'newcomer@example.com', requested_at: '2026-02-01' }];
      const user = userEvent.setup();
      renderAdminPage();
      await screen.findByText('newcomer@example.com');

      await user.click(screen.getByRole('button', { name: /accept/i }));

      await waitFor(() =>
        expect(insertSpy).toHaveBeenCalledWith({
          church_email: 'newcomer@example.com',
          user_id: 'u1',
          verified_at: expect.any(String)
        })
      );
    });

    it('denies an access request, inserting into the denylist and reloading only the requests', async () => {
      requestsData = [{ request_user_id: 'u1', email: 'spammer@example.com', requested_at: '2026-02-01' }];
      const user = userEvent.setup();
      renderAdminPage();
      await screen.findByText('spammer@example.com');
      rpcSpy.mockClear();

      await user.click(screen.getByRole('button', { name: /deny/i }));

      await waitFor(() => expect(denyInsertSpy).toHaveBeenCalledWith({ email: 'spammer@example.com' }));
      // Denying shouldn't touch verified_members at all.
      expect(insertSpy).not.toHaveBeenCalled();
      expect(rpcSpy).toHaveBeenCalledWith('list_access_requests');
    });
  });
});
