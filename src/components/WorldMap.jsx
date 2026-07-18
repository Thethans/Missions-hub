import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import basemapStyle from '../map/basemapStyle.js';
import MapPopupCard from './MapPopupCard.jsx';
import MapLegend from './MapLegend.jsx';

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

export default function WorldMap({ selected, onSelect, onDataLoaded }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const hoveredId = useRef(null);
  const selectedIdRef = useRef(null);
  const activeRef = useRef(null);
  const religionActiveRef = useRef(null);
  const onDataLoadedRef = useRef(onDataLoaded);
  const [counts, setCounts] = useState(null);
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
  // consistently across the app.
  const [religionActive, setReligionActive] = useState(() => new Set());
  const [dataError, setDataError] = useState(false);
  const dataPromiseRef = useRef(null);
  activeRef.current = active;
  religionActiveRef.current = religionActive;
  onDataLoadedRef.current = onDataLoaded;

  // Fetches the geojson independent of MapLibre's WebGL 'load' event, which
  // never fires in environments without real WebGL support (e.g. the
  // Puppeteer instance scripts/prerender.js runs at build time) — that used
  // to leave `counts` null and the "Finding unreached peoples…" message
  // permanently on screen for crawlers. Stored as a promise (not just fired
  // in an effect) so the map's own 'load' handler below can await the same
  // fetch instead of issuing a second one.
  useEffect(() => {
    dataPromiseRef.current = fetch(DATA_URL)
      .then((res) => res.json())
      .then((data) => {
        const tally = { unreached: 0, formative: 0, reached: 0 };
        const religionTally = {};
        data.features.forEach((f) => {
          if (tally[f.properties.progressStatus] !== undefined) tally[f.properties.progressStatus] += 1;
          const r = f.properties.religion;
          if (r) religionTally[r] = (religionTally[r] || 0) + 1;
        });
        setCounts(tally);
        setReligions(Object.keys(religionTally).sort((a, b) => religionTally[b] - religionTally[a]));
        setReligionCounts(religionTally);
        onDataLoadedRef.current?.(data.features);
        return data;
      })
      .catch((e) => {
        console.error('Could not load people-groups.geojson — run scripts/fetch-joshua-project.mjs first', e);
        setDataError(true);
        return null;
      });
  }, []);

  // Applies whatever's in activeRef/religionActiveRef right now to the map's
  // layers. Reading from refs (rather than closing over state from whichever
  // render scheduled this) means it's always safe to call this the instant a
  // layer exists — no dependence on the map's one-shot 'load' event having
  // fired at just the right moment, which is what silently dropped filter
  // updates before (isStyleLoaded() can go false again well after initial
  // load, e.g. mid-tile-fetch after a flyTo, and 'load' never fires a second
  // time to catch up).
  const applyFilters = (map) => {
    const currentActive = activeRef.current;
    const currentReligions = religionActiveRef.current;
    const statusExpr = ['in', ['get', 'progressStatus'], ['literal', Array.from(currentActive)]];
    const religionExpr =
      currentReligions.size === 0
        ? true
        : ['in', ['get', 'religion'], ['literal', Array.from(currentReligions)]];
    const filter = ['all', statusExpr, religionExpr];

    if (map.getLayer('people-groups-points')) map.setFilter('people-groups-points', filter);
    if (map.getLayer('people-groups-shadow')) map.setFilter('people-groups-shadow', filter);
    if (map.getLayer('people-groups-pulse')) {
      map.setFilter(
        'people-groups-pulse',
        currentActive.has('unreached')
          ? ['all', ['==', ['get', 'progressStatus'], 'unreached'], religionExpr]
          : ['==', ['get', 'progressStatus'], '']
      );
    }
  };

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: basemapStyle,
      center: [10, 15],
      zoom: 1.4
    });
    mapRef.current = map;

    // The container isn't always settled to its final layout size the
    // instant the map constructs (e.g. right after a route change) — a
    // resize on load and on window resize keeps the canvas from getting
    // stuck at whatever width it happened to measure first.
    const onWindowResize = () => map.resize();
    window.addEventListener('resize', onWindowResize);

    map.on('load', async () => {
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

      const tally = { unreached: 0, formative: 0, reached: 0 };
      const religionTally = {};
      data.features.forEach((f) => {
        if (tally[f.properties.progressStatus] !== undefined) tally[f.properties.progressStatus] += 1;
        const r = f.properties.religion;
        if (r) religionTally[r] = (religionTally[r] || 0) + 1;
      });
      setCounts(tally);
      // Most-represented first — reads as "the real major religions in this
      // dataset" rather than an alphabetical list.
      setReligions(Object.keys(religionTally).sort((a, b) => religionTally[b] - religionTally[a]));
      setReligionCounts(religionTally);

      // Share the loaded features with the parent (MapAccessibleSearch) so a
      // keyboard-only visitor has a way to find and select a people group
      // without needing to click a point on the canvas — MapLibre's canvas
      // layer has no native keyboard path. `generateId: true` below assigns
      // each feature's internal id by its position in this exact array, so
      // the array index doubles as the id needed for setFeatureState.
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

      map.addSource('people-groups', { type: 'geojson', data, generateId: true });

      // Soft drop-shadow approximation: a larger, lower-opacity circle layer
      // beneath the main markers (MapLibre circle layers have no native
      // blur/shadow paint property).
      map.addLayer({
        id: 'people-groups-shadow',
        type: 'circle',
        source: 'people-groups',
        paint: {
          'circle-radius': ['+', CIRCLE_RADIUS, 3],
          'circle-color': '#16233b',
          'circle-opacity': 0.12,
          'circle-blur': 0.6
        }
      });

      // A duplicate, wider ring behind unreached points only — animated via
      // rAF below into a slow pulse, drawing the eye to the greatest need.
      map.addLayer({
        id: 'people-groups-pulse',
        type: 'circle',
        source: 'people-groups',
        filter: ['==', ['get', 'progressStatus'], 'unreached'],
        paint: {
          'circle-radius': CIRCLE_RADIUS,
          'circle-color': '#b5482f',
          'circle-opacity': 0.35,
          'circle-blur': 0.4
        }
      });

      map.addLayer({
        id: 'people-groups-points',
        type: 'circle',
        source: 'people-groups',
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

      // Catch up to whatever the legend's filter state is by the time these
      // layers actually exist (the fetch above may have taken a beat, during
      // which the visitor could already have toggled a status).
      applyFilters(map);

      // Fade markers in a beat after the shadow/pulse layers land, instead
      // of everything popping in at once.
      requestAnimationFrame(() => {
        map.setPaintProperty('people-groups-points', 'circle-opacity', CIRCLE_FILL_OPACITY);
      });

      // Slow pulse: radius and opacity breathe via a sine wave. Reduced to a
      // single static ring if the visitor prefers reduced motion.
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReduced) {
        let raf;
        const start = performance.now();
        const tick = (now) => {
          const t = (now - start) / 1000;
          const pulse = (Math.sin(t * 1.4) + 1) / 2; // 0..1
          map.setPaintProperty('people-groups-pulse', 'circle-radius', [
            '+',
            CIRCLE_RADIUS,
            6 + pulse * 10
          ]);
          map.setPaintProperty('people-groups-pulse', 'circle-opacity', 0.12 + pulse * 0.18);
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        map.once('remove', () => cancelAnimationFrame(raf));
      }

      map.on('click', 'people-groups-points', (e) => {
        const feature = e.features[0];
        // flyTo + highlight both happen in the `selected`-driven effect below,
        // so a click and a keyboard-search selection (which also just calls
        // onSelect) end up with identical map behavior from one code path.
        onSelect({ ...feature.properties, coordinates: feature.geometry.coordinates, id: feature.id });
      });

      map.on('mousemove', 'people-groups-points', (e) => {
        if (!e.features.length) return;
        if (hoveredId.current !== null) {
          map.setFeatureState({ source: 'people-groups', id: hoveredId.current }, { hover: false });
        }
        hoveredId.current = e.features[0].id;
        map.setFeatureState({ source: 'people-groups', id: hoveredId.current }, { hover: true });
      });
      map.on('mouseenter', 'people-groups-points', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'people-groups-points', () => {
        map.getCanvas().style.cursor = '';
        if (hoveredId.current !== null) {
          map.setFeatureState({ source: 'people-groups', id: hoveredId.current }, { hover: false });
        }
        hoveredId.current = null;
      });
    });

    return () => {
      window.removeEventListener('resize', onWindowResize);
      map.remove();
    };
  }, [onSelect]);

  useEffect(() => {
    if (mapRef.current) applyFilters(mapRef.current);
  }, [active, religionActive]);

  // Flies to and highlights whichever point is selected, regardless of
  // whether the selection came from a canvas click or from
  // MapAccessibleSearch — the single path keeps both entry points visually
  // identical instead of duplicating flyTo/highlight logic per trigger.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedIdRef.current !== null) {
      map.setFeatureState({ source: 'people-groups', id: selectedIdRef.current }, { select: false });
      selectedIdRef.current = null;
    }

    if (!selected || selected.id == null || !map.getSource('people-groups')) return;

    selectedIdRef.current = selected.id;
    map.setFeatureState({ source: 'people-groups', id: selected.id }, { select: true });
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
      <div id="map-container" ref={mapContainer} />
      <div className="map-vignette" aria-hidden="true" />
      {dataError ? (
        <p className="map-data-error" role="alert">
          Couldn't load people-group data right now — try refreshing the page.
        </p>
      ) : (
        <>
          {counts === null && (
            <p className="map-loading" role="status">Finding unreached peoples&hellip;</p>
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
