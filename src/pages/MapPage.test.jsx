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
// give it) — WorldMap.jsx gates every setLayoutProperty call on `if
// (map.getLayer(id))`, and a vi.fn() called with no mockImplementation
// returns undefined, which would silently skip every visibility change and
// mask a real filtering bug as a passing test.
//
// `queryRenderedFeatures` needs to be a controllable stand-in too:
// WorldMap.jsx polls it after a status/religion change to detect when the
// repaint has actually caught up (MapLibre's 'idle' event, a debounced
// 'sourcedata' quiet-period, and comparing against a precomputed expected
// count were all tried first and each proved unreliable on a real map —
// see the comment in WorldMap.jsx), rather than trusting any single event
// or target. `__setRenderedFeatures` lets a test control what it returns
// between polls, to simulate the repaint catching up over time.
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

  it('shows an "Updating map…" indicator until the rendered markers actually settle on the new filter, not just on a timer/event guess', async () => {
    // Regression coverage: a MapLibre 'idle' listener, a debounced
    // 'sourcedata' listener, and comparing against a precomputed "true"
    // expected count were all tried first — each produced a real, measured
    // case of the indicator lying (clearing too early while the canvas
    // still showed stale markers, or in the expected-count case, never
    // clearing at all because queryRenderedFeatures — being viewport/
    // tile-boundary-based — permanently undercounts the full dataset by a
    // small margin when widening back toward it). What actually holds
    // regardless of direction: once the repaint is done, the rendered
    // count stops changing between two consecutive polls.
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

      // Now the repaint actually catches up to the filter — but a single
      // matching read isn't enough either (that's what let a viewport-
      // clipped, still-changing count look "done" prematurely); it has to
      // read the same matching count twice in a row.
      lastMockMap.__setRenderedFeatures([{ properties: { progressStatus: 'unreached', religion: 'Islam' } }]);
      await vi.advanceTimersByTimeAsync(250);
      expect(screen.getByText(/updating map/i)).toBeInTheDocument();

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

  it('clears quickly on a stable-but-viewport-clipped count, instead of waiting for the 20s cap (regression: "taking off a filter takes forever")', async () => {
    // The exact bug this covers: widening a filter back toward the full
    // dataset (deselecting a religion, or re-enabling a status) genuinely
    // finishes rendering within ~1s in practice, but
    // queryRenderedFeatures() — being viewport/tile-boundary-based — can
    // permanently return slightly fewer features than the *true* total.
    // The previous version of this check compared against that true total
    // and would poll all the way to the 20s cap even though the map had
    // already settled. This fixture's rendered count (999, deliberately
    // "one short" of a round 1000) never needs to match anything external
    // — it only needs to stop changing.
    vi.useFakeTimers();
    try {
      render(
        <MemoryRouter initialEntries={['/map']}>
          <MapPage />
        </MemoryRouter>
      );

      await vi.waitFor(() => expect(lastMockMap).not.toBeNull());
      await lastMockMap.__triggerLoad();

      const stableFeature = { properties: { progressStatus: 'unreached', religion: 'Islam' } };
      lastMockMap.__setRenderedFeatures(Array.from({ length: 999 }, () => stableFeature));

      const chip = await vi.waitFor(() => screen.getByRole('button', { name: /islam/i }));
      fireEvent.click(chip);

      expect(screen.getByText(/updating map/i)).toBeInTheDocument();

      // Two consecutive polls read the same stable 999 — well under any
      // "true" total, but that's the point: nothing here depends on
      // knowing what the true total is.
      await vi.advanceTimersByTimeAsync(500);

      expect(screen.queryByText(/updating map/i)).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('toggles per-religion layer visibility when a religion chip is clicked, not just a visual chip toggle', async () => {
    // Religion is now expressed as a setLayoutProperty visibility flip on
    // that religion's own layers (see WorldMap.jsx for why: a setFilter()
    // narrowing the old single shared source took 4-9+s under real load,
    // since it forced a full worker-thread re-bucket of ~16,400 features —
    // splitting into one source per religion turns "toggle a religion"
    // into an instant, no-re-bucket layout change instead).
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
    lastMockMap.setLayoutProperty.mockClear();

    await user.click(chip);

    const visibilityCalls = lastMockMap.setLayoutProperty.mock.calls.filter((args) => args[1] === 'visibility');
    const islamPointsCall = visibilityCalls.find((args) => args[0] === 'people-groups-islam-unreached-points');
    const christianityPointsCall = visibilityCalls.find((args) => args[0] === 'people-groups-christianity-unreached-points');
    expect(islamPointsCall?.[2]).toBe('visible');
    expect(christianityPointsCall?.[2]).toBe('none');
  });

  it('toggles per-status layer visibility when a status chip is clicked, not setFilter', async () => {
    // Status used to still go through setFilter even after the religion
    // split (measured 0.6-4.7s depending on direction/load) — buckets are
    // now split by (religion, status) together, so status is a visibility
    // flip too, same as religion.
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
                properties: { name: 'Group B', progressStatus: 'reached', population: 1000, religion: 'Islam' }
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

    // Anchored: plain /reached/i also matches "Unreached".
    const reachedChip = await screen.findByRole('button', { name: /^reached/i });
    lastMockMap.setFilter.mockClear();
    lastMockMap.setLayoutProperty.mockClear();

    await user.click(reachedChip);

    // Clicking "Reached" while all three statuses default to active turns
    // it off, leaving Unreached (untouched by this click) still visible.
    expect(lastMockMap.setFilter).not.toHaveBeenCalled();
    const visibilityCalls = lastMockMap.setLayoutProperty.mock.calls.filter((args) => args[1] === 'visibility');
    expect(visibilityCalls.find((args) => args[0] === 'people-groups-islam-reached-points')?.[2]).toBe('none');
    expect(visibilityCalls.find((args) => args[0] === 'people-groups-islam-unreached-points')?.[2]).toBe('visible');
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

    // The very first visibility application (right after layers are
    // added, not a later toggle) must already reflect the URL's religion.
    const visibilityCalls = lastMockMap.setLayoutProperty.mock.calls.filter((args) => args[1] === 'visibility');
    expect(visibilityCalls.find((args) => args[0] === 'people-groups-islam-unreached-points')?.[2]).toBe('visible');
    expect(visibilityCalls.find((args) => args[0] === 'people-groups-christianity-unreached-points')?.[2]).toBe('none');
    expect(visibilityCalls.find((args) => args[0] === 'people-groups-hinduism-unreached-points')?.[2]).toBe('none');
  });
});
