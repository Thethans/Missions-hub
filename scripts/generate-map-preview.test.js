import { describe, it, expect } from 'vitest';
import { sample } from './generate-map-preview.js';

const makeFeature = (lon, lat, status) => ({
  geometry: { type: 'Point', coordinates: [lon, lat] },
  properties: { progressStatus: status }
});

describe('sample', () => {
  it('caps the output at the requested target count', () => {
    const features = Array.from({ length: 2000 }, (_, i) => makeFeature(-180 + (i % 360), 0, 'unreached'));
    expect(sample(features, 450).length).toBeLessThanOrEqual(450);
  });

  it('preserves each sampled point\'s real progressStatus', () => {
    const features = [makeFeature(-100, 10, 'unreached'), makeFeature(100, -10, 'reached')];
    const dots = sample(features, 2);
    expect(dots.map((d) => d.s).sort()).toEqual(['reached', 'unreached']);
  });

  it('returns an empty array for no features', () => {
    expect(sample([], 450)).toEqual([]);
  });

  it('produces coordinates within the projected viewBox', () => {
    const features = Array.from({ length: 500 }, (_, i) => makeFeature(-180 + i * 0.7, -50 + (i % 100), 'formative'));
    const dots = sample(features, 450);
    for (const d of dots) {
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x).toBeLessThanOrEqual(800);
      expect(d.y).toBeGreaterThanOrEqual(0);
      expect(d.y).toBeLessThanOrEqual(400);
    }
  });
});
