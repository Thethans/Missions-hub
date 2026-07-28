import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import basemapStyle from '../map/basemapStyle.js';
import MapPopupCard from './MapPopupCard.jsx';
import MapLegend from './MapLegend.jsx';
import { getPreloaded, setPreloaded } from '../utils/preloadedData.js';

const DATA_URL = '/data/people-groups.geojson';
const STATUSES = ['unreached', 'formative', 'reached'];

// sqrt-scaled so a handful of huge people groups don't visually swallow the
// map; stops tuned against the actual population distribution in the live
// dataset (p10/p50/p90/p99 percentiles), not a guessed range.
const CIRCLE_RADIUS = ['interpolate', ['linear'], ['sqrt', ['get', 'population']], 7, 2, 160, 5, 790, 10, 4650, 16];

const CIRCLE_COLOR = [
  'match',
  ['get', 'progressStatus'],
  'unreached', '#b5482f',
  'formative', '#d9a441',
  'reached', '#4c8a5e',
  '#999999'
];

// Redundant, non-color channel for status, since red/gold/green (the most
// common colorblind confusion pair) is otherwise the only signal on the
// canvas: unreached is a solid disc, formative is a faded disc, reached is a
// hollow ring (near-zero fill, thicker colored stroke so it still reads at a
// glance). Mirrored in the legend/popup/detail-panel dot CSS so the shape
// language is consistent everywhere status appears.
const CIRCLE_FILL_OPACITY = [
  'match',
  ['get', 'progressStatus'],
  'unreached', 0.85,
  'formative', 0.55,
  'reached', 0.1,
  0.85
];

const CIRCLE_STROKE_WIDTH = [
  'let',
  'base',
  ['match', ['get', 'progressStatus'], 'unreached', 1, 'formative', 1.25, 'reached', 2, 1],
  [
    'case',
    ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
    ['+', ['var', 'base'], 1.5],
    ['var', 'base']
  ]
];

// Reached's ring is nearly all stroke (the fill is almost transparent), so it
// needs its own color rather than the shared cream — cream reads fine as a
// hairline edge on a solid disc but would nearly vanish against the light
// land tiles as a ring's only visible pixels.
const CIRCLE_STROKE_COLOR = [
  'case',
  ['boolean', ['feature-state', 'select'], false], '#2b6e76',
  ['match', ['get', 'progressStatus'], 'reached', '#345f42', '#faf7f0']
];

// A light lat/lon grid every 30° — cheap to hand-generate, and it gives the
// flat basemap an "instrument panel" cartographic texture instead of a
// plain fill, without adding any 3D.
function buildGraticule() {
  const features = [];
  for (let lon = -180; lon <= 180; lon += 30) {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[lon, -70], [lon, 70]] }
    });
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[-180, lat], [180, lat]] }
    });
  }
  return { type: 'FeatureCollection', features };
}

// A feature with no religion recorded still needs somewhere to live —
// grouped under this sentinel so it's shown whenever no religion filter is
// active (matching the old single-source behavior) and hidden whenever any
// specific religion is picked (since it can't match a named one). Real data
// currently has zero such features, but the source is refreshed weekly by
// an external pipeline, so this shouldn't silently vanish them if that
// ever changes.
const UNCLASSIFIED_RELIGION = null;

// One MapLibre source (and matching shadow/points layers, plus a pulse
// layer for the 'unreached' bucket specifically) per (religion, status)
// combination, instead of one giant source for all ~16,400 points. Every
// feature in a bucket's source already satisfies both dimensions by
// construction — no layer needs a `filter` at all — so toggling either
// dimension is purely a setLayoutProperty visibility flip: a synchronous
// change MapLibre applies without touching any geometry, instead of a
// setFilter() call, which forces a worker-thread re-walk of the source.
// Measured directly against the single-source approach this replaced:
// setFilter-driven filtering took 4-9+s depending on load and direction
// (worse when *widening* back toward the full dataset); splitting only by
// religion first got narrowing down to ~1s but left status changes on the
// same slow setFilter path (measured 0.6-4.7s) — this is the second half,
// splitting by status too so nothing user-facing uses setFilter anymore.
function bucketSourceId(religion, status) {
  const key = religion || 'unclassified';
  return 'people-groups-' + key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') + '-' + status;
}

export default function WorldMap({ selected, onSelect, onDataLoaded, initialReligions }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  // { id, source } of the currently-hovered/selected feature — both are
  // needed (not just id) because setFeatureState/clearing it must target
  // the specific per-bucket source that feature actually lives in.
  const hoveredRef = useRef(null);
  const selectedRef = useRef(null);
  const activeRef = useRef(null);
  const religionActiveRef = useRef(null);
  const onDataLoadedRef = useRef(onDataLoaded);
  const filterGenerationRef = useRef(0);
  // One entry per (religion, status) bucket, built once the data loads:
  // { religion, status, sourceId, pointsLayer, shadowLayer, pulseLayer }.
  // pulseLayer is null for non-'unreached' buckets — the pulse ring only
  // ever highlights unreached groups, so there's nothing to build for the
  // other two statuses. Every per-bucket operation (visibility, click/
  // hover attachment, the completion-polling query) is driven off this
  // instead of a single hardcoded layer/source name.
  const bucketsRef = useRef([]);
  const [counts, setCounts] = useState(() => getPreloaded('mapCounts') ?? null);
  const [active, setActive] = useState(() => new Set(STATUSES));
  // Religion options + counts come from whatever the live geojson pull
  // actually contains (set on load, see the tally below) — not a hand-typed
  // "major world religions" list, so the filter never offers a category with
  // zero real matches or silently drops one Joshua Project adds later.
  const [religions, setReligions] = useState([]);
  const [religionCounts, setReligionCounts] = useState({});
  // Empty set = no restriction (every religion shown) — unlike `active`
  // above, where membership means "shown" and the set starts full. Matches
  // the same "nothing selected = unfiltered" chip semantics already used by
  // OpportunitiesExplorer's agency filter, so multi-option filters behave
  // consistently across the app. Seeded from `initialReligions` (MapPage's
  // ?religion= param) so a deep link from the quiz's "see where they are"
  // link lands pre-filtered — a value that doesn't match any real religion
  // in the loaded data just yields zero results, same graceful-degradation
  // behavior as an unrecognized ?agency= on the opportunities page.
  const [religionActive, setReligionActive] = useState(() => new Set(initialReligions));
  const [dataError, setDataError] = useState(false);
  // Distinct from dataError: this is MapLibre itself failing (basemap tiles/
  // style/glyphs unreachable), not the people-groups.geojson fetch — the map
  // canvas is unusable either way, but the two have different causes and
  // different copy, and the 'error' event MapLibre fires for a tile/style
  // failure was previously unhandled entirely, leaving a blank/broken canvas
  // with no message at all.
  const [tileError, setTileError] = useState(false);
  // Neither of the two states above covers every way this can go wrong:
  // if WebGL context creation itself hangs or silently no-ops (seen in
  // practice under resource pressure — e.g. a browser that's already
  // exhausted its WebGL context budget from other tabs/maps), MapLibre
  // never fires 'load' *or* 'error', and "Finding unreached peoples…"
  // was stuck forever with no message and no way out. This is the
  // fallback for that case specifically.
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  // Now that both status and religion are pure visibility flips (no
  // setFilter anywhere), this should resolve within a single poll cycle
  // almost always — kept as a defensive safety net rather than removed
  // outright, in case a slow device/heavy load ever makes even a batch of
  // visibility changes take a beat to repaint.
  const [filtering, setFiltering] = useState(false);
  activeRef.current = active;
  religionActiveRef.current = religionActive;
  onDataLoadedRef.current = onDataLoaded;

  // Applies whatever's in activeRef/religionActiveRef right now to every
  // bucket's layers. Reading from refs (rather than closing over state
  // from whichever render scheduled this) means it's always safe to call
  // this the instant a bucket's layers exist — no dependence on the map's
  // one-shot 'load' event having fired at just the right moment.
  const applyFilters = (map) => {
    const currentActive = activeRef.current;
    const currentReligions = religionActiveRef.current;

    bucketsRef.current.forEach(({ religion, status, pointsLayer, shadowLayer, pulseLayer }) => {
      if (!map.getLayer(pointsLayer)) return; // this bucket's layers aren't added yet
      const visible =
        currentActive.has(status) &&
        (currentReligions.size === 0 || (religion != null && currentReligions.has(religion)));
      const visibility = visible ? 'visible' : 'none';
      map.setLayoutProperty(pointsLayer, 'visibility', visibility);
      map.setLayoutProperty(shadowLayer, 'visibility', visibility);
      if (pulseLayer) map.setLayoutProperty(pulseLayer, 'visibility', visibility);
    });
  };

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: basemapStyle,
      center: [10, 15],
      zoom: 1.4
    });
    mapRef.current = map;

    // Backstop for 'load'/'error' both failing to fire at all (see
    // loadTimedOut above) — cleared the moment either does, in the 'load'
    // and 'error' handlers below.
    const loadTimeout = window.setTimeout(() => {
      console.error('MapLibre never fired load or error within 20s — WebGL context likely failed silently');
      setLoadTimedOut(true);
    }, 20000);

    // MapLibre fires 'error' for tile/style/glyph fetch failures — none of
    // which reject a promise or throw anywhere React would see them, so
    // without this the canvas just sits blank or half-rendered with nothing
    // telling the visitor (or error monitoring) that anything went wrong.
    map.on('error', (e) => {
      window.clearTimeout(loadTimeout);
      console.error('MapLibre error:', e.error);
      setTileError(true);
    });

    // The container isn't always settled to its final layout size the
    // instant the map constructs (e.g. right after a route change) — a
    // resize on load and on window resize keeps the canvas from getting
    // stuck at whatever width it happened to measure first.
    const onWindowResize = () => map.resize();
    window.addEventListener('resize', onWindowResize);

    map.on('load', async () => {
      window.clearTimeout(loadTimeout);
      map.resize();
      let data;
      try {
        const res = await fetch(DATA_URL);
        data = await res.json();
      } catch (e) {
        console.error('Could not load people-groups.geojson — run scripts/fetch-joshua-project.mjs first', e);
        setDataError(true);
        return;
      }

      // Bake a stable global id (this array's index) onto each feature
      // BEFORE grouping below — MapAccessibleSearch and MapPage's weekly
      // featured-group both already use "index into this exact array" as
      // the id contract for setFeatureState/selection, and splitting into
      // per-bucket sources must not break that. Explicit ids (rather than
      // each source's own generateId:true, which would restart from 0 in
      // every bucket) keep it intact.
      data.features.forEach((f, i) => {
        f.id = i;
      });

      const tally = { unreached: 0, formative: 0, reached: 0 };
      const religionTally = {};
      const byBucket = new Map(); // sourceId -> { religion, status, features: [] }
      data.features.forEach((f) => {
        const status = f.properties.progressStatus;
        if (tally[status] !== undefined) tally[status] += 1;
        const r = f.properties.religion || UNCLASSIFIED_RELIGION;
        if (r) religionTally[r] = (religionTally[r] || 0) + 1;

        const sourceId = bucketSourceId(r, status);
        if (!byBucket.has(sourceId)) byBucket.set(sourceId, { religion: r, status, features: [] });
        byBucket.get(sourceId).features.push(f);
      });
      setPreloaded('mapCounts', tally);
      setCounts(tally);
      // Most-represented first — reads as "the real major religions in this
      // dataset" rather than an alphabetical list.
      setReligions(Object.keys(religionTally).sort((a, b) => religionTally[b] - religionTally[a]));
      setReligionCounts(religionTally);

      // Share the loaded features with the parent (MapAccessibleSearch) so a
      // keyboard-only visitor has a way to find and select a people group
      // without needing to click a point on the canvas — MapLibre's canvas
      // layer has no native keyboard path. The baked-in `id` above (this
      // array's index) is what setFeatureState/selection use.
      onDataLoadedRef.current?.(data.features);

      map.addSource('graticule', { type: 'geojson', data: buildGraticule() });
      map.addLayer(
        {
          id: 'graticule-lines',
          type: 'line',
          source: 'graticule',
          paint: { 'line-color': 'rgba(250, 247, 240, 0.08)', 'line-width': 1 }
        },
        'countries-label'
      );

      const buckets = [];
      byBucket.forEach(({ religion, status, features }, sourceId) => {
        map.addSource(sourceId, { type: 'geojson', data: { type: 'FeatureCollection', features } });

        const shadowLayer = `${sourceId}-shadow`;
        const pointsLayer = `${sourceId}-points`;

        // Soft drop-shadow approximation: a larger, lower-opacity circle
        // layer beneath the main markers (MapLibre circle layers have no
        // native blur/shadow paint property).
        map.addLayer({
          id: shadowLayer,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': ['+', CIRCLE_RADIUS, 3],
            'circle-color': '#16233b',
            'circle-opacity': 0.12,
            'circle-blur': 0.6
          }
        });

        // A duplicate, wider ring behind unreached points only — animated
        // via rAF below into a slow pulse, drawing the eye to the greatest
        // need. Every feature in an 'unreached'-status bucket's source is
        // already unreached by construction, so unlike the pre-split
        // version this needs no filter.
        let pulseLayer = null;
        if (status === 'unreached') {
          pulseLayer = `${sourceId}-pulse`;
          map.addLayer({
            id: pulseLayer,
            type: 'circle',
            source: sourceId,
            paint: {
              'circle-radius': CIRCLE_RADIUS,
              'circle-color': '#b5482f',
              'circle-opacity': 0.35,
              'circle-blur': 0.4
            }
          });
        }

        map.addLayer({
          id: pointsLayer,
          type: 'circle',
          source: sourceId,
          paint: {
            'circle-radius': [
              'case',
              ['any', ['boolean', ['feature-state', 'hover'], false], ['boolean', ['feature-state', 'select'], false]],
              ['+', CIRCLE_RADIUS, 4],
              CIRCLE_RADIUS
            ],
            'circle-color': CIRCLE_COLOR,
            'circle-opacity': 0,
            'circle-opacity-transition': { duration: 900 },
            'circle-stroke-width': CIRCLE_STROKE_WIDTH,
            'circle-stroke-color': CIRCLE_STROKE_COLOR
          }
        });

        buckets.push({ religion, status, sourceId, pointsLayer, shadowLayer, pulseLayer });
      });
      bucketsRef.current = buckets;
      const pointsLayerIds = buckets.map((b) => b.pointsLayer);
      const pulseLayerIds = buckets.map((b) => b.pulseLayer).filter(Boolean);

      // Catch up to whatever the legend's filter state is by the time these
      // layers actually exist (the fetch above may have taken a beat, during
      // which the visitor could already have toggled a status/religion).
      applyFilters(map);

      // Fade markers in a beat after the shadow/pulse layers land, instead
      // of everything popping in at once.
      requestAnimationFrame(() => {
        pointsLayerIds.forEach((layerId) => map.setPaintProperty(layerId, 'circle-opacity', CIRCLE_FILL_OPACITY));
      });

      // Slow pulse: radius and opacity breathe via a sine wave, applied to
      // every unreached bucket's pulse layer each tick. Reduced to a single
      // static ring if the visitor prefers reduced motion.
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced) {
        let raf;
        let lastPaintUpdate = 0;
        const start = performance.now();
        // Full sine cycle is ~4.5s (2π / 1.4 rad/s) — throttled to ~12fps
        // (an ~85ms gate, not every rAF frame) is visually indistinguishable
        // for a breath that slow, and keeps the *aggregate* setPaintProperty
        // call rate across all pulse buckets in the same ballpark as the
        // original single-layer version at ~15fps.
        const tick = (now) => {
          if (now - lastPaintUpdate >= 85) {
            lastPaintUpdate = now;
            const t = (now - start) / 1000;
            const pulse = (Math.sin(t * 1.4) + 1) / 2; // 0..1
            const radius = ['+', CIRCLE_RADIUS, 6 + pulse * 10];
            const opacity = 0.12 + pulse * 0.18;
            pulseLayerIds.forEach((layerId) => {
              map.setPaintProperty(layerId, 'circle-radius', radius);
              map.setPaintProperty(layerId, 'circle-opacity', opacity);
            });
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        map.once('remove', () => cancelAnimationFrame(raf));
      }

      map.on('click', pointsLayerIds, (e) => {
        const feature = e.features[0];
        // flyTo + highlight both happen in the `selected`-driven effect below,
        // so a click and a keyboard-search selection (which also just calls
        // onSelect) end up with identical map behavior from one code path.
        onSelect({ ...feature.properties, coordinates: feature.geometry.coordinates, id: feature.id });
      });

      map.on('mousemove', pointsLayerIds, (e) => {
        if (!e.features.length) return;
        const next = e.features[0];
        if (hoveredRef.current) {
          map.setFeatureState({ source: hoveredRef.current.source, id: hoveredRef.current.id }, { hover: false });
        }
        hoveredRef.current = { id: next.id, source: next.source };
        map.setFeatureState({ source: next.source, id: next.id }, { hover: true });
      });
      map.on('mouseenter', pointsLayerIds, () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', pointsLayerIds, () => {
        map.getCanvas().style.cursor = '';
        if (hoveredRef.current) {
          map.setFeatureState({ source: hoveredRef.current.source, id: hoveredRef.current.id }, { hover: false });
        }
        hoveredRef.current = null;
      });
    });

    return () => {
      window.clearTimeout(loadTimeout);
      window.removeEventListener('resize', onWindowResize);
      map.remove();
    };
  }, [onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    applyFilters(map);
    // Only meaningful once the layers actually exist — the very first run
    // of this effect can fire before 'load' has added any buckets yet
    // (applyFilters' own per-layer getLayer() guard makes that call a
    // harmless no-op), and there's nothing to wait on repainting in that
    // case.
    const pointsLayerIds = bucketsRef.current.map((b) => b.pointsLayer);
    if (pointsLayerIds.length > 0 && map.getLayer(pointsLayerIds[0])) {
      const myGeneration = ++filterGenerationRef.current;
      setFiltering(true);

      // Every completion signal tried here has turned out unreliable at
      // one point or another: 'idle' can go indefinitely unfired (the
      // pulse layers' rAF loop keeps calling setPaintProperty every
      // frame), a debounced 'sourcedata' quiet-period can fire early
      // mid-rebucket, and comparing queryRenderedFeatures().length against
      // a precomputed "true" total works for narrowing but not widening
      // (viewport/tile-boundary undercounting means the target is never
      // reached). What actually holds regardless of direction: once the
      // repaint is done, the rendered count stops changing. Waiting for
      // two consecutive non-zero reads 250ms apart to agree needs no
      // precomputed target and isn't fooled by a single transient empty
      // read either.
      const currentActive = activeRef.current;
      const currentReligions = religionActiveRef.current;
      const matchesActiveFilter = (f) =>
        currentActive.has(f.properties.progressStatus) &&
        (currentReligions.size === 0 || currentReligions.has(f.properties.religion));
      const stillCurrent = () => filterGenerationRef.current === myGeneration;

      let pollId = null;
      let capId = null;
      let lastCount = null;

      const finish = () => {
        if (!stillCurrent()) return;
        clearTimeout(pollId);
        clearTimeout(capId);
        setFiltering(false);
      };

      const poll = () => {
        if (!stillCurrent()) return;
        const rendered = map.queryRenderedFeatures({ layers: pointsLayerIds });
        const stable = rendered.length > 0 && rendered.length === lastCount && rendered.every(matchesActiveFilter);
        lastCount = rendered.length;
        if (stable) {
          finish();
        } else {
          pollId = setTimeout(poll, 250);
        }
      };
      pollId = setTimeout(poll, 250);
      // Absolute cap: if the repaint genuinely never catches up (extreme
      // load, tab backgrounded), don't let the indicator get stuck
      // showing forever — that's worse than the gap it exists to explain.
      capId = setTimeout(finish, 20000);

      return () => {
        clearTimeout(pollId);
        clearTimeout(capId);
      };
    }
  }, [active, religionActive]);

  // Flies to and highlights whichever point is selected, regardless of
  // whether the selection came from a canvas click or from
  // MapAccessibleSearch — the single path keeps both entry points visually
  // identical instead of duplicating flyTo/highlight logic per trigger.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedRef.current) {
      map.setFeatureState({ source: selectedRef.current.source, id: selectedRef.current.id }, { select: false });
      selectedRef.current = null;
    }

    if (!selected || selected.id == null) return;
    const sourceId = bucketSourceId(selected.religion || UNCLASSIFIED_RELIGION, selected.progressStatus);
    if (!map.getSource(sourceId)) return;

    selectedRef.current = { id: selected.id, source: sourceId };
    map.setFeatureState({ source: sourceId, id: selected.id }, { select: true });
    map.flyTo({ center: selected.coordinates, zoom: Math.max(map.getZoom(), 3.5), speed: 0.8 });
  }, [selected]);

  const toggleStatus = (status) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        if (next.size === 1) return prev; // keep at least one category visible
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  // Empty-set-means-unfiltered (see religionActive above), so toggling the
  // last active chip back off is always allowed — it just returns to
  // "show every religion" rather than needing one forced-on category.
  const toggleReligion = (religion) => {
    setReligionActive((prev) => {
      const next = new Set(prev);
      if (next.has(religion)) next.delete(religion);
      else next.add(religion);
      return next;
    });
  };

  return (
    <div className="map-wrapper">
      <div id="map-container" ref={mapContainer} data-hydration-reset="children class style" />
      <div className="map-vignette" aria-hidden="true" />
      {tileError ? (
        <p className="map-data-error" role="alert">
          Couldn't load the map right now — try refreshing the page.
        </p>
      ) : dataError ? (
        <p className="map-data-error" role="alert">
          Couldn't load people-group data right now — try refreshing the page.
        </p>
      ) : loadTimedOut ? (
        <p className="map-data-error" role="alert">
          The map is taking longer than expected to load — try refreshing the page.
        </p>
      ) : (
        <>
          {counts === null && (
            <p className="map-loading" role="status">Finding unreached peoples&hellip;</p>
          )}
          {filtering && (
            <p className="map-loading" role="status">Updating map&hellip;</p>
          )}
          <MapLegend
            counts={counts}
            active={active}
            onToggle={toggleStatus}
            religions={religions}
            religionCounts={religionCounts}
            religionActive={religionActive}
            onToggleReligion={toggleReligion}
          />
        </>
      )}
      {selected && <MapPopupCard properties={selected} onClose={() => onSelect(null)} />}
    </div>
  );
}
