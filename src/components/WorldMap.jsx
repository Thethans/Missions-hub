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

export default function WorldMap({ selected, onSelect }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const hoveredId = useRef(null);
  const [counts, setCounts] = useState(null);
  const [active, setActive] = useState(() => new Set(STATUSES));

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
        return;
      }

      const tally = { unreached: 0, formative: 0, reached: 0 };
      data.features.forEach((f) => {
        if (tally[f.properties.progressStatus] !== undefined) tally[f.properties.progressStatus] += 1;
      });
      setCounts(tally);

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
            ['boolean', ['feature-state', 'hover'], false],
            ['+', CIRCLE_RADIUS, 4],
            CIRCLE_RADIUS
          ],
          'circle-color': CIRCLE_COLOR,
          'circle-opacity': 0,
          'circle-opacity-transition': { duration: 900 },
          'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 1],
          'circle-stroke-color': '#faf7f0'
        }
      });

      // Fade markers in a beat after the shadow/pulse layers land, instead
      // of everything popping in at once.
      requestAnimationFrame(() => {
        map.setPaintProperty('people-groups-points', 'circle-opacity', 0.85);
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
        onSelect(feature.properties);
        map.flyTo({ center: feature.geometry.coordinates, zoom: Math.max(map.getZoom(), 3.5), speed: 0.8 });
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
    const map = mapRef.current;
    if (!map) return;
    const applyFilter = () => {
      const filter = ['in', ['get', 'progressStatus'], ['literal', Array.from(active)]];
      if (map.getLayer('people-groups-points')) map.setFilter('people-groups-points', filter);
      if (map.getLayer('people-groups-shadow')) map.setFilter('people-groups-shadow', filter);
      if (map.getLayer('people-groups-pulse')) {
        map.setFilter(
          'people-groups-pulse',
          active.has('unreached') ? ['==', ['get', 'progressStatus'], 'unreached'] : ['==', ['get', 'progressStatus'], '']
        );
      }
    };
    if (map.isStyleLoaded()) applyFilter();
    else map.once('load', applyFilter);
  }, [active]);

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

  return (
    <div className="map-wrapper">
      <div id="map-container" ref={mapContainer} />
      <div className="map-vignette" aria-hidden="true" />
      <MapLegend counts={counts} active={active} onToggle={toggleStatus} />
      {selected && <MapPopupCard properties={selected} onClose={() => onSelect(null)} />}
    </div>
  );
}
