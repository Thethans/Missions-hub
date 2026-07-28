import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useMissionaries from './useMissionaries';
import { missionaries as staticMissionaries } from '../data/missionaries';

let mockSupabase: unknown = null;
let selectError: { message: string } | null = null;
let selectData: unknown[] | null = null;
const orderSpy = vi.fn();

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
          order: (col: string) => {
            orderSpy(col);
            return Promise.resolve(selectError ? { data: null, error: selectError } : { data: selectData, error: null });
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

describe('useMissionaries', () => {
  beforeEach(() => {
    selectError = null;
    selectData = [ROW];
    orderSpy.mockClear();
    mockSupabase = buildSupabaseMock();
  });

  it('falls back to the static dataset when supabase is not configured', async () => {
    mockSupabase = null;
    const { result } = renderHook(() => useMissionaries());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.missionaries).toEqual(staticMissionaries);
    expect(result.current.error).toBe(false);
  });

  it('fetches from supabase and maps snake_case rows to the Missionary shape', async () => {
    const { result } = renderHook(() => useMissionaries());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(orderSpy).toHaveBeenCalledWith('name');
    expect(result.current.missionaries).toEqual([
      {
        id: 'row-1',
        name: 'Row One',
        nameNote: undefined,
        location: 'Nowhere',
        lat: 1,
        lng: 2,
        role: 'Testing',
        ministry: 'Testing ministry',
        prayerCount: 5,
        supportGoal: 50,
        budget: [{ item: 'Rent', purpose: 'Housing', amount: 100 }],
        prayerRequests: [{ text: 'Pray', type: 'sticky' }],
        sensitiveCount: 0,
        updates: [],
        locationSensitive: false
      }
    ]);
    expect(result.current.error).toBe(false);
  });

  it('falls back to the static dataset and reports an error when the fetch fails', async () => {
    selectError = { message: 'network down' };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useMissionaries());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.missionaries).toEqual(staticMissionaries);
    expect(result.current.error).toBe(true);
    expect(consoleError).toHaveBeenCalled();
  });

  it('falls back to the static dataset when supabase returns an empty table', async () => {
    selectData = [];
    const { result } = renderHook(() => useMissionaries());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.missionaries).toEqual(staticMissionaries);
    expect(result.current.error).toBe(false);
  });
});
