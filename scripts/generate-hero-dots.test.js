import { describe, it, expect } from 'vitest';
import { project, rasterize, formatCoord, buildRoutes } from './generate-hero-dots.js';

describe('project', () => {
  it('maps (0, 0) to the horizontal center of the viewBox', () => {
    const [x] = project(0, 0);
    expect(x).toBeCloseTo(400, 0); // VIEW_W / 2
  });

  it('maps the west/east edges to the viewBox edges', () => {
    expect(project(-180, 0)[0]).toBeCloseTo(0, 0);
    expect(project(180, 0)[0]).toBeCloseTo(800, 0);
  });

  it('clamps latitude outside the mapped band instead of going off-canvas', () => {
    const [, yNorthPole] = project(0, 90);
    const [, yCappedNorth] = project(0, 76);
    expect(yNorthPole).toBe(yCappedNorth);
  });
});

describe('rasterize', () => {
  it('produces a dot count within the requested range for a dense point cloud', () => {
    const points = Array.from({ length: 5000 }, (_, i) => [
      -180 + (i % 360),
      -50 + ((i * 7) % 120)
    ]);
    const dots = rasterize(points, 600, 900);
    expect(dots.length).toBeGreaterThanOrEqual(1);
    expect(dots.length).toBeLessThanOrEqual(900);
  });

  it('collapses duplicate/near-identical coordinates onto the same grid cell', () => {
    const points = Array.from({ length: 100 }, () => [10, 10]); // all identical
    const dots = rasterize(points, 1, 900);
    expect(dots.length).toBe(1);
  });

  it('returns an empty array for no points', () => {
    expect(rasterize([], 600, 900)).toEqual([]);
  });
});

describe('formatCoord', () => {
  it('formats a northern/eastern coordinate', () => {
    expect(formatCoord(37.5665, 126.978)).toBe('37.57°N 126.98°E');
  });

  it('formats a northern/western coordinate', () => {
    expect(formatCoord(41.8781, -87.6298)).toBe('41.88°N 87.63°W');
  });

  it('formats a southern/eastern coordinate', () => {
    expect(formatCoord(-15.5, 40.2)).toBe('15.50°S 40.20°E');
  });
});

describe('buildRoutes', () => {
  const makeFeature = (lon, lat, name) => ({
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: { name, progressStatus: 'unreached' }
  });

  it('builds one route per sending city, using real feature coordinates as destinations', () => {
    const features = Array.from({ length: 30 }, (_, i) => makeFeature(-170 + i * 12, 10, `Group ${i}`));
    const routes = buildRoutes(features);

    expect(routes).toHaveLength(3);
    for (const route of routes) {
      expect(route.from.label).toMatch(/°[NS] .*°[EW]/);
      expect(route.to.label).toMatch(/°[NS] .*°[EW]/);
      expect(typeof route.controlX).toBe('number');
      expect(typeof route.controlY).toBe('number');
    }
  });

  it('returns no routes when there are fewer unreached features than sending cities', () => {
    expect(buildRoutes([makeFeature(0, 0, 'Only One')])).toEqual([]);
  });
});
