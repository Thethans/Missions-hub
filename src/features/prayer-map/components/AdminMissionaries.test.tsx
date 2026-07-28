import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminMissionaries from './AdminMissionaries';

let mockSupabase: unknown = null;
let rowsData: unknown[] | null = [];
let rowsError: { message: string } | null = null;
let insertError: { message: string } | null = null;
let updateError: { message: string } | null = null;
let deleteError: { message: string } | null = null;

const insertSpy = vi.fn();
const updateSpy = vi.fn();
const deleteSpy = vi.fn();

vi.mock('../../../supabaseClient.js', () => ({
  get supabase() {
    return mockSupabase;
  }
}));

function buildSupabaseMock() {
  return {
    from: (table: string) => {
      if (table !== 'missionaries') throw new Error(`Unexpected table in test: ${table}`);
      return {
        select: () => ({
          order: () => Promise.resolve(rowsError ? { data: null, error: rowsError } : { data: rowsData, error: null })
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
  };
}

const ROW = {
  id: 'row-1',
  name: 'Row One',
  name_note: null,
  location: 'Nowhere',
  lat: 1,
  lng: 2,
  role: 'Testing',
  ministry: 'Testing ministry',
  prayer_count: 5,
  support_goal: 50,
  budget: [{ item: 'Rent', purpose: 'Housing', amount: 100 }],
  prayer_requests: [{ text: 'Pray', type: 'sticky' }],
  sensitive_count: 0,
  updates: [],
  location_sensitive: false
};

describe('AdminMissionaries', () => {
  beforeEach(() => {
    rowsData = [];
    rowsError = null;
    insertError = null;
    updateError = null;
    deleteError = null;
    insertSpy.mockClear();
    updateSpy.mockClear();
    deleteSpy.mockClear();
    mockSupabase = buildSupabaseMock();
  });

  it('shows empty-state copy when there are no missionaries', async () => {
    render(<AdminMissionaries />);
    expect(await screen.findByText(/no missionaries yet/i)).toBeInTheDocument();
  });

  it('lists loaded missionaries', async () => {
    rowsData = [ROW];
    render(<AdminMissionaries />);
    expect(await screen.findByText('Row One')).toBeInTheDocument();
    expect(screen.getByText('Nowhere')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows an error message if loading fails', async () => {
    rowsError = { message: 'boom' };
    render(<AdminMissionaries />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load missionaries/i);
  });

  it('adds a new missionary from the form', async () => {
    const user = userEvent.setup();
    render(<AdminMissionaries />);
    await screen.findByText(/no missionaries yet/i);

    await user.click(screen.getByRole('button', { name: /add missionary/i }));
    await user.type(screen.getByLabelText(/^id/i), 'new-id');
    await user.type(screen.getByLabelText(/^name$/i), 'New Person');
    await user.type(screen.getByLabelText(/^location$/i), 'Somewhere');
    await user.type(screen.getByLabelText(/latitude/i), '10');
    await user.type(screen.getByLabelText(/longitude/i), '20');
    await user.type(screen.getByLabelText(/^role$/i), 'Testing');
    await user.type(screen.getByLabelText(/ministry overview/i), 'Overview text');

    await user.click(screen.getByRole('button', { name: /^add missionary$/i }));

    await waitFor(() =>
      expect(insertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'new-id',
          name: 'New Person',
          location: 'Somewhere',
          lat: 10,
          lng: 20,
          role: 'Testing',
          ministry: 'Overview text',
          budget: [],
          prayer_requests: [],
          updates: []
        })
      )
    );
  });

  it('rejects invalid JSON in the budget field without submitting', async () => {
    const user = userEvent.setup();
    render(<AdminMissionaries />);
    await screen.findByText(/no missionaries yet/i);

    await user.click(screen.getByRole('button', { name: /add missionary/i }));
    await user.type(screen.getByLabelText(/^id/i), 'new-id');
    await user.type(screen.getByLabelText(/^name$/i), 'New Person');
    await user.type(screen.getByLabelText(/^location$/i), 'Somewhere');
    await user.type(screen.getByLabelText(/latitude/i), '10');
    await user.type(screen.getByLabelText(/longitude/i), '20');
    await user.type(screen.getByLabelText(/^role$/i), 'Testing');
    await user.type(screen.getByLabelText(/ministry overview/i), 'Overview text');

    const budgetField = screen.getByLabelText(/^budget/i);
    await user.clear(budgetField);
    await user.type(budgetField, 'not valid json');

    await user.click(screen.getByRole('button', { name: /^add missionary$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/must each be valid json/i);
    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('pre-fills the form and updates an existing missionary', async () => {
    rowsData = [ROW];
    const user = userEvent.setup();
    render(<AdminMissionaries />);
    await screen.findByText('Row One');

    await user.click(screen.getByRole('button', { name: /^edit$/i }));

    const idField = screen.getByLabelText(/^id/i) as HTMLInputElement;
    expect(idField.value).toBe('row-1');
    expect(idField).toBeDisabled();
    expect((screen.getByLabelText(/^name$/i) as HTMLInputElement).value).toBe('Row One');

    const nameField = screen.getByLabelText(/^name$/i);
    await user.clear(nameField);
    await user.type(nameField, 'Updated Name');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() =>
      expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'row-1', name: 'Updated Name' }), 'id', 'row-1')
    );
  });

  it('deletes a missionary after confirming', async () => {
    rowsData = [ROW];
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();
    render(<AdminMissionaries />);
    await screen.findByText('Row One');

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Row One'));
    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith('id', 'row-1'));
  });

  it('does not delete when the confirmation is cancelled', async () => {
    rowsData = [ROW];
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(<AdminMissionaries />);
    await screen.findByText('Row One');

    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(deleteSpy).not.toHaveBeenCalled();
  });
});
