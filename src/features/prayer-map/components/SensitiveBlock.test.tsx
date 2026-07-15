import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import SensitiveBlock from './SensitiveBlock';

let mockRows: { text: string }[] | null = [];
let mockError: { message: string } | null = null;
const eqSpy = vi.fn();

let mockSupabase: unknown = null;

vi.mock('../../../supabaseClient.js', () => ({
  get supabase() {
    return mockSupabase;
  }
}));

function buildSupabaseMock() {
  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (col: string, val: string) => {
          eqSpy(table, columns, col, val);
          return Promise.resolve(mockError ? { data: null, error: mockError } : { data: mockRows, error: null });
        }
      })
    })
  };
}

describe('SensitiveBlock', () => {
  beforeEach(() => {
    mockRows = [{ text: 'Confidential detail A' }, { text: 'Confidential detail B' }];
    mockError = null;
    eqSpy.mockClear();
    mockSupabase = buildSupabaseMock();
  });

  it('renders nothing when sensitiveCount is 0, regardless of authState', () => {
    const { container } = render(
      <SensitiveBlock missionaryId="m1" sensitiveCount={0} authState="verified" onSignIn={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
    expect(eqSpy).not.toHaveBeenCalled();
  });

  it('shows the locked prompt with a sign-in button for a guest, and never queries Supabase', () => {
    render(<SensitiveBlock missionaryId="m1" sensitiveCount={2} authState="guest" onSignIn={() => {}} />);
    expect(screen.getByText(/2 sensitive prayer requests/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in to view/i })).toBeInTheDocument();
    expect(eqSpy).not.toHaveBeenCalled();
  });

  it('shows a distinct message for pending-verification, with no sign-in button', () => {
    render(<SensitiveBlock missionaryId="m1" sensitiveCount={1} authState="pending-verification" onSignIn={() => {}} />);
    expect(screen.getByText(/hasn't added you to the confidential-prayer list/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /sign in to view/i })).not.toBeInTheDocument();
    expect(eqSpy).not.toHaveBeenCalled();
  });

  it('fetches and reveals the confidential text only when verified', async () => {
    render(<SensitiveBlock missionaryId="rebecca-id" sensitiveCount={2} authState="verified" onSignIn={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Confidential detail A')).toBeInTheDocument();
    });
    expect(screen.getByText('Confidential detail B')).toBeInTheDocument();
    expect(eqSpy).toHaveBeenCalledWith('missionary_sensitive_requests', 'text', 'missionary_id', 'rebecca-id');
  });

  it('shows an error state if the verified fetch itself fails, without crashing', async () => {
    mockError = { message: 'RLS denied' };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<SensitiveBlock missionaryId="m1" sensitiveCount={1} authState="verified" onSignIn={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText(/couldn't load confidential requests/i)).toBeInTheDocument();
    });
    expect(consoleError).toHaveBeenCalled();
  });
});
