import { describe, it, expect } from 'vitest';
import { initials } from './missionaryDisplay.js';

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Grace Marrow')).toBe('GM');
  });

  it('uses one letter for a single-word name', () => {
    expect(initials('Mei-Lin')).toBe('M');
  });

  it('ignores extra words beyond the first two', () => {
    expect(initials('John Michael Smith')).toBe('JM');
  });

  it('uppercases the result', () => {
    expect(initials('grace marrow')).toBe('GM');
  });

  it('returns an empty string for an empty/missing name', () => {
    expect(initials('')).toBe('');
    expect(initials(undefined)).toBe('');
  });
});
