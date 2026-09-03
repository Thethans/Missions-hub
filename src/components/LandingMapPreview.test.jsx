import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingMapPreview from './LandingMapPreview.jsx';

// Same jsdom-has-no-WebGL stub as MapPage.test.jsx — see that file's comment
// for why each piece of this mock exists.
function createMockMap() {
  const loadHandlers = [];
  const errorHandlers = [];
  const map = new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === 'on') {
          return (event, cb) => {
            if (event === 'load' && typeof cb === 'function') loadHandlers.push(cb);
            if (event === 'error' && typeof cb === 'function') errorHandlers.push(cb);
            return map;
          };
        }
        if (prop === 'once') return () => map;
        if (prop === 'getCanvas') return () => ({ style: {} });
        if (prop === '__triggerLoad') return () => loadHandlers.forEach((cb) => cb());
        if (prop === '__triggerError') return (error) => errorHandlers.forEach((cb) => cb({ error }));
        if (!(prop in target)) target[prop] = vi.fn();
        return target[prop];
      }
    }
  );
  return map;
}

let lastMockMap = null;
vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(function MockMap() {
      lastMockMap = createMockMap();
      return lastMockMap;
    })
  }
}));

const GEOJSON = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [10, 15] }, properties: { country: 'Sudan', progressStatus: 'unreached' } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [20, 15] }, properties: { country: 'Chad', progressStatus: 'unreached' } }
  ]
};

function mockFetch() {
  return vi.fn((url) => {
    if (String(url).includes('opportunities-fallback')) {
      return Promise.resolve({
        json: () => Promise.resolve([{ agency: 'IMB' }, { agency: 'Pioneers' }, { agency: 'IMB' }])
      });
    }
    return Promise.resolve({ json: () => Promise.resolve(GEOJSON) });
  });
}

describe('LandingMapPreview', () => {
  beforeEach(() => {
    lastMockMap = null;
    global.fetch = mockFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a loading state, then adds the clustered source/layers once the geojson loads', async () => {
    render(
      <MemoryRouter>
        <LandingMapPreview />
      </MemoryRouter>
    );

    expect(screen.getByRole('status')).toHaveTextContent(/loading the map/i);

    await waitFor(() => expect(lastMockMap).not.toBeNull());
    await lastMockMap.__triggerLoad();

    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());

    const addSourceCalls = lastMockMap.addSource.mock.calls;
    const pointsSourceCall = addSourceCalls.find((args) => args[0] === 'landing-preview-points');
    expect(pointsSourceCall?.[1]).toMatchObject({ cluster: true, data: GEOJSON });

    const layerIds = lastMockMap.addLayer.mock.calls.map((args) => args[0].id);
    expect(layerIds).toEqual(expect.arrayContaining(['clusters', 'cluster-count', 'unclustered-point']));
  });

  it('shows a data-error message instead of crashing when the geojson fetch fails', async () => {
    global.fetch = vi.fn((url) => {
      if (String(url).includes('opportunities-fallback')) {
        return Promise.resolve({ json: () => Promise.resolve([]) });
      }
      return Promise.reject(new Error('network down'));
    });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <LandingMapPreview />
      </MemoryRouter>
    );

    await waitFor(() => expect(lastMockMap).not.toBeNull());
    await lastMockMap.__triggerLoad();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/couldn't load people-group data/i);
    });

    consoleError.mockRestore();
  });

  it('shows a map-level error message when MapLibre itself fires an error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter>
        <LandingMapPreview />
      </MemoryRouter>
    );

    await waitFor(() => expect(lastMockMap).not.toBeNull());
    lastMockMap.__triggerError(new Error('tile fetch failed'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/couldn't load the map/i);
    });

    consoleError.mockRestore();
  });

  it('renders the quiz CTA linking to /quiz', async () => {
    render(
      <MemoryRouter>
        <LandingMapPreview />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: /take the quiz/i })).toHaveAttribute('href', '/quiz');
  });

  it('populates the "Explore by country" select with real countries from the loaded data', async () => {
    render(
      <MemoryRouter>
        <LandingMapPreview />
      </MemoryRouter>
    );

    await waitFor(() => expect(lastMockMap).not.toBeNull());
    await lastMockMap.__triggerLoad();

    const select = await screen.findByLabelText(/explore by country/i);
    expect(select).toContainHTML('Sudan');
    expect(select).toContainHTML('Chad');
  });
});
