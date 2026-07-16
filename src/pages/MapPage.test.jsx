import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MapPage from './MapPage.jsx';

// jsdom has no WebGL/canvas support, so MapLibre itself can't run in tests.
// This stubs the whole library with Proxy-based instances that return a
// no-op vi.fn() for any method WorldMap.jsx happens to call — resilient to
// that component's exact API surface changing, unlike hand-listing every
// MapLibre method. Only `getCanvas` needs a concrete shape (code reads
// `.style.cursor` off it) and `on('load', cb)` needs to actually capture the
// callback so tests can drive the load lifecycle.
function createMockMap() {
  const loadHandlers = [];
  const map = new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === 'on') {
          return (event, cb) => {
            if (event === 'load' && typeof cb === 'function') loadHandlers.push(cb);
            return map;
          };
        }
        if (prop === 'getCanvas') return () => ({ style: {} });
        if (prop === 'getZoom') return () => 1.4;
        if (prop === '__triggerLoad') return () => loadHandlers.forEach((cb) => cb());
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
    // Arrow functions can't be invoked with `new` — WorldMap.jsx does
    // `new maplibregl.Map(...)`, so this must be a real function/constructor.
    Map: vi.fn(function MockMap() {
      lastMockMap = createMockMap();
      return lastMockMap;
    })
  }
}));

describe('MapPage', () => {
  beforeEach(() => {
    lastMockMap = null;
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [10, 15] },
                properties: { name: 'Test Group', progressStatus: 'unreached', population: 1000 }
              }
            ]
          })
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the map hero and legend without crashing', () => {
    render(
      <MemoryRouter initialEntries={['/map']}>
        <MapPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /the world map/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unreached/i })).toBeInTheDocument();
  });

  it('shows a data-error message instead of crashing when the geojson fetch fails', async () => {
    global.fetch = vi.fn(() => Promise.reject(new Error('network down')));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={['/map']}>
        <MapPage />
      </MemoryRouter>
    );

    // Drive the map's 'load' handler the way MapLibre would once tiles are ready.
    await waitFor(() => expect(lastMockMap).not.toBeNull());
    await lastMockMap.__triggerLoad();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/couldn't load people-group data/i);
    });

    consoleError.mockRestore();
  });

  it('seeds the detail panel with a featured people group once data loads, instead of only instructional text (P3-C)', async () => {
    render(
      <MemoryRouter initialEntries={['/map']}>
        <MapPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(lastMockMap).not.toBeNull());
    await lastMockMap.__triggerLoad();

    await waitFor(() => {
      expect(screen.getByText(/this week's featured people group/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Test Group' })).toBeInTheDocument();
    expect(screen.queryByText(/click any point on the map/i)).not.toBeInTheDocument();
  });

  it('selecting the featured group swaps the panel to the full profile view', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/map']}>
        <MapPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(lastMockMap).not.toBeNull());
    await lastMockMap.__triggerLoad();
    await waitFor(() => screen.getByText(/this week's featured people group/i));

    await user.click(screen.getByRole('button', { name: /explore on the map/i }));

    await waitFor(() => {
      expect(screen.queryByText(/this week's featured people group/i)).not.toBeInTheDocument();
    });
    expect(screen.getByText(/an estimated 1,000 people/i)).toBeInTheDocument();
  });
});
