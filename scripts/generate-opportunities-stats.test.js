import { describe, it, expect } from 'vitest';
import { computeStats } from './generate-opportunities-stats.js';

describe('computeStats', () => {
  it('counts total opportunities and unique agencies', () => {
    const opportunities = [
      { agency: 'imb' },
      { agency: 'imb' },
      { agency: 'wec' },
      { agency: 'crossworld' }
    ];
    expect(computeStats(opportunities)).toEqual({ count: 4, agencyCount: 3 });
  });

  it('handles an empty list', () => {
    expect(computeStats([])).toEqual({ count: 0, agencyCount: 0 });
  });
});
