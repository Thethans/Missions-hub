import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import MapPage from './MapPage.jsx';

// jsdom has no WebGL/canvas support, so MapLibre itself can't run in tests.
// This stubs the whole library with Proxy-based instances that return a
// no-op vi.fn() for any method WorldMap.jsx happens to call — resilient to
// that component's exact API surface changing, unlike hand-listing every
// MapLibre method. Only `getCanvas` needs a concrete shape (code reads
// `.style.cursor` off it) and `on('load', cb)` needs to actually capture the
// callback so tests can drive the load lifecycle. `getLayer` must return a
// truthy stand-in (not the bare vi.fn() the generic fallback below would
// give it) — WorldMap.jsx gates every setFilter call on `if
// (map.getLayer(id))`, and a vi.fn() called with no mockImplementation
// returns undefined, which would silently skip every setFilter call and
// mask a real filtering bug as a passing test.
//
// `queryRenderedFeatures` needs to be a controllable stand-in too:
// WorldMap.jsx polls it after a filter change to detect when the repaint
// has actually caught up (both MapLibre's 'idle' event and a debounced
// 'sourcedata' were tried first and both proved unreliable on a real map —
// see the comment in WorldMap.jsx), rather than trusting any single event.
// `__setRenderedFeatures` lets a test control what it returns between
// polls, to simulate the repaint catching up over time.
function createMockMap() {
  const loadHandlers = [];
  const errorHandlers = [];
  let renderedFeatures = [];
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
        if (prop === 'getZoom') return () => 1.4;
        if (prop === 'getLayer') return () => ({});
        if (prop === 'queryRenderedFeatures') return () => renderedFeatures;
        if (prop === '__triggerLoad') return () => loadHandlers.forEach((cb) => cb());
        if (prop === '__triggerError') return (error) => errorHandlers.forEach((cb) => cb({ error }));
        if (prop === '__setRenderedFeatures') return (features) => { renderedFeatures = features; };
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
                properties: { name: 'Test Group', progressStatus: 'unreached', population: 1000, religion: 'Islam' }
              }
            ]
          })
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the map hero and legend without crashing', async () => {
    render(
      <MemoryRouter initialEntries={['/map']}>
        <MapPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /the world map/i })).toBeInTheDocument();
    // WorldMap is behind a Suspense boundary (its own chunk, split out so
    // maplibre-gl doesn't block the hero text painting) — findBy* waits for
    // it to resolve instead of asserting on the fallback.
    expect(await screen.findByRole('button', { name: /unreached/i })).toBeInTheDocument();
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

  it('shows a map-level error message instead of a blank canvas when MapLibre itself fires an error (tile/style/glyph fetch failure)', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <MemoryRouter initialEntries={['/map']}>
        <MapPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(lastMockMap).not.toBeNull());
    lastMockMap.__triggerError(new Error('tile fetch failed'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/couldn't load the map/i);
    });
    expect(consoleError).toHaveBeenCalledWith('MapLibre error:', expect.any(Error));

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

  it('renders a religion filter chip from the loaded data and toggles it on click', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/map']}>
        <MapPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(lastMockMap).not.toBeNull());
    await lastMockMap.__triggerLoad();

    const chip = await screen.findByRole('button', { name: /islam/i });
    expect(chip).toHaveAttribute('aria-pressed', 'false');

    await user.click(chip);
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows an "Updating map…" indicator until the rendered markers actually match the new filter, not just on a timer/event guess', async () => {
    // Regression coverage for the real bug: both a MapLibre 'idle'
    // listener and a debounced 'sourcedata' listener were tried first and
    // each produced a real, measured case of clearing while the canvas
    // still showed the old, unfiltered markers. The only signal that
    // can't lie is checking reality — polling queryRenderedFeatures for
    // whether what's on screen actually satisfies the filter that was
    // just set.
    vi.useFakeTimers();
    try {
      render(
        <MemoryRouter initialEntries={['/map']}>
          <MapPage />
        </MemoryRouter>
      );

      await vi.waitFor(() => expect(lastMockMap).not.toBeNull());
      await lastMockMap.__triggerLoad();

      // Still showing the old unfiltered mix at first — this is the
      // "repaint hasn't caught up yet" state the indicator must cover.
      lastMockMap.__setRenderedFeatures([
        { properties: { progressStatus: 'unreached', religion: 'Islam' } },
        { properties: { progressStatus: 'unreached', religion: 'Christianity' } }
      ]);

      const chip = await vi.waitFor(() => screen.getByRole('button', { name: /islam/i }));
      fireEvent.click(chip);

      expect(screen.getByText(/updating map/i)).toBeInTheDocument();

      // A poll interval passes, but the canvas still hasn't caught up —
      // the indicator must still be showing, not cleared on a timer alone.
      await vi.advanceTimersByTimeAsync(250);
      expect(screen.getByText(/updating map/i)).toBeInTheDocument();

      // Now the repaint actually catches up to the filter.
      lastMockMap.__setRenderedFeatures([{ properties: { progressStatus: 'unreached', religion: 'Islam' } }]);
      await vi.advanceTimersByTimeAsync(250);

      expect(screen.queryByText(/updating map/i)).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('clears the "Updating map…" indicator via an absolute cap if the repaint never catches up', async () => {
    // Defensive floor: if the rendered markers somehow never converge to
    // match the filter (extreme load, a stalled worker), the indicator
    // must not get stuck showing forever — that's worse than the gap it
    // exists to explain.
    vi.useFakeTimers();
    try {
      render(
        <MemoryRouter initialEntries={['/map']}>
          <MapPage />
        </MemoryRouter>
      );

      await vi.waitFor(() => expect(lastMockMap).not.toBeNull());
      await lastMockMap.__triggerLoad();

      // Never matches the Islam-only filter, no matter how long we wait.
      lastMockMap.__setRenderedFeatures([{ properties: { progressStatus: 'unreached', religion: 'Christianity' } }]);

      const chip = await vi.waitFor(() => screen.getByRole('button', { name: /islam/i }));
      fireEvent.click(chip);

      expect(screen.getByText(/updating map/i)).toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(20000);

      expect(screen.queryByText(/updating map/i)).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('actually calls map.setFilter with a religion clause when a religion chip is toggled, not just a visual toggle', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [10, 15] },
                properties: { name: 'Group A', progressStatus: 'unreached', population: 1000, religion: 'Islam' }
              },
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [20, 15] },
                properties: { name: 'Group B', progressStatus: 'unreached', population: 1000, religion: 'Christianity' }
              }
            ]
          })
      })
    );

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/map']}>
        <MapPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(lastMockMap).not.toBeNull());
    await lastMockMap.__triggerLoad();

    const chip = await screen.findByRole('button', { name: /islam/i });
    lastMockMap.setFilter.mockClear();

    await user.click(chip);

    // The most recent setFilter call for the points layer must actually
    // narrow by religion — not just re-apply the status filter with the
    // religion clause silently dropped.
    const pointsCalls = lastMockMap.setFilter.mock.calls.filter((args) => args[0] === 'people-groups-points');
    expect(pointsCalls.length).toBeGreaterThan(0);
    const [, appliedFilter] = pointsCalls[pointsCalls.length - 1];
    expect(JSON.stringify(appliedFilter)).toContain('Islam');
    expect(JSON.stringify(appliedFilter)).not.toContain('Christianity');
  });

  it('lands pre-filtered by religion when opened via a ?religion= deep link (from the quiz)', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [10, 15] },
                properties: { name: 'Group A', progressStatus: 'unreached', population: 1000, religion: 'Islam' }
              },
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [20, 15] },
                properties: { name: 'Group B', progressStatus: 'unreached', population: 1000, religion: 'Christianity' }
              },
              {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [30, 15] },
                properties: { name: 'Group C', progressStatus: 'unreached', population: 1000, religion: 'Hinduism' }
              }
            ]
          })
      })
    );

    render(
      <MemoryRouter initialEntries={['/map?religion=Islam']}>
        <MapPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(lastMockMap).not.toBeNull());
    await lastMockMap.__triggerLoad();

    const chip = await screen.findByRole('button', { name: /islam/i });
    expect(chip).toHaveAttribute('aria-pressed', 'true');

    // The very first filter application (right after layers are added, not
    // a later toggle) must already carry the religion clause from the URL.
    const pointsCalls = lastMockMap.setFilter.mock.calls.filter((args) => args[0] === 'people-groups-points');
    expect(pointsCalls.length).toBeGreaterThan(0);
    expect(JSON.stringify(pointsCalls[0][1])).toContain('Islam');
    expect(JSON.stringify(pointsCalls[0][1])).not.toContain('Hinduism');
  });
});
