import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useMemberSession from './useMemberSession';

// Mirrors the small slice of the supabase-js client this hook actually uses.
let mockSession: { user: { id: string } } | null = null;
let authChangeCallback: ((event: string, session: unknown) => void) | null = null;
let verifiedMembersRow: { is_admin: boolean; revoked_at: string | null } | null = null;
let verifiedMembersError: { message: string } | null = null;
const signOutMock = vi.fn(() => Promise.resolve({ error: null }));
const signInWithOtpMock = vi.fn<() => Promise<{ error: { message: string } | null }>>(() =>
  Promise.resolve({ error: null })
);

let mockSupabase: unknown = null;

vi.mock('../../../supabaseClient.js', () => ({
  get supabase() {
    return mockSupabase;
  }
}));

function buildSupabaseMock() {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: mockSession } }),
      onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
        authChangeCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signOut: signOutMock,
      signInWithOtp: signInWithOtpMock
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          is: () => ({
            maybeSingle: () =>
              Promise.resolve(
                verifiedMembersError
                  ? { data: null, error: verifiedMembersError }
                  : { data: verifiedMembersRow, error: null }
              )
          })
        })
      })
    })
  };
}

describe('useMemberSession', () => {
  beforeEach(() => {
    mockSession = null;
    authChangeCallback = null;
    verifiedMembersRow = null;
    verifiedMembersError = null;
    signOutMock.mockClear();
    signInWithOtpMock.mockClear();
    mockSupabase = buildSupabaseMock();
  });

  it('starts as guest when there is no session', async () => {
    const { result } = renderHook(() => useMemberSession());
    await waitFor(() => expect(result.current.authState).toBe('guest'));
    expect(result.current.isAdmin).toBe(false);
  });

  it('becomes verified when the signed-in user is an active, non-revoked verified_members row', async () => {
    mockSession = { user: { id: 'user-1' } };
    verifiedMembersRow = { is_admin: false, revoked_at: null };

    const { result } = renderHook(() => useMemberSession());
    await waitFor(() => expect(result.current.authState).toBe('verified'));
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.remainingMs).toBeGreaterThan(0);
  });

  it('exposes isAdmin when the verified row has is_admin set', async () => {
    mockSession = { user: { id: 'admin-1' } };
    verifiedMembersRow = { is_admin: true, revoked_at: null };

    const { result } = renderHook(() => useMemberSession());
    await waitFor(() => expect(result.current.authState).toBe('verified'));
    expect(result.current.isAdmin).toBe(true);
  });

  it('is pending-verification when signed in but not on the allowlist', async () => {
    mockSession = { user: { id: 'user-2' } };
    verifiedMembersRow = null;

    const { result } = renderHook(() => useMemberSession());
    await waitFor(() => expect(result.current.authState).toBe('pending-verification'));
    expect(result.current.isAdmin).toBe(false);
  });

  it('fails closed to pending-verification (never verified) if the membership check itself errors', async () => {
    mockSession = { user: { id: 'user-3' } };
    verifiedMembersError = { message: 'network error' };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useMemberSession());
    await waitFor(() => expect(result.current.authState).toBe('pending-verification'));
    expect(result.current.isAdmin).toBe(false);

    consoleError.mockRestore();
  });

  it('reacts to onAuthStateChange — signing in later flips guest to verified', async () => {
    const { result } = renderHook(() => useMemberSession());
    await waitFor(() => expect(result.current.authState).toBe('guest'));

    verifiedMembersRow = { is_admin: false, revoked_at: null };
    act(() => {
      authChangeCallback?.('SIGNED_IN', { user: { id: 'user-4' } });
    });

    await waitFor(() => expect(result.current.authState).toBe('verified'));
  });

  it('signOut resets to guest and calls supabase.auth.signOut', async () => {
    mockSession = { user: { id: 'user-5' } };
    verifiedMembersRow = { is_admin: false, revoked_at: null };

    const { result } = renderHook(() => useMemberSession());
    await waitFor(() => expect(result.current.authState).toBe('verified'));

    act(() => {
      result.current.signOut('test reason');
    });

    expect(result.current.authState).toBe('guest');
    expect(result.current.toast).toEqual({ message: 'test reason', kind: 'info' });
    expect(signOutMock).toHaveBeenCalled();
  });

  it('signInWithEmail sends a magic link with the /prayer-map redirect', async () => {
    const { result } = renderHook(() => useMemberSession());
    await waitFor(() => expect(result.current.authState).toBe('guest'));

    let response;
    await act(async () => {
      response = await result.current.signInWithEmail('someone@example.com');
    });

    expect(response).toEqual({ sent: true });
    expect(signInWithOtpMock).toHaveBeenCalledWith({
      email: 'someone@example.com',
      options: { emailRedirectTo: expect.stringContaining('/prayer-map') }
    });
  });

  it('signInWithEmail surfaces the error when Supabase rejects it', async () => {
    signInWithOtpMock.mockResolvedValueOnce({ error: { message: 'Invalid email' } });
    const { result } = renderHook(() => useMemberSession());
    await waitFor(() => expect(result.current.authState).toBe('guest'));

    let response;
    await act(async () => {
      response = await result.current.signInWithEmail('bad');
    });

    expect(response).toEqual({ sent: false, error: 'Invalid email' });
  });
});
