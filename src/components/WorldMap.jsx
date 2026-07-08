import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import basemapStyle from '../map/basemapStyle.js';
import MapPopupCard from './MapPopupCard.jsx';
import MapLegend from './MapLegend.jsx';

const DATA_URL = '/data/people-groups.geojson';

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

export default function WorldMap() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: basemapStyle,
      center: [10, 15],
      zoom: 1.4
    });
    mapRef.current = map;

    map.on('load', async () => {
      let data;
      try {
        const res = await fetch(DATA_URL);
        data = await res.json();
      } catch (e) {
        console.error('Could not load people-groups.geojson — run scripts/fetch-joshua-project.mjs first', e);
        return;
      }

      map.addSource('people-groups', { type: 'geojson', data });

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

      map.addLayer({
        id: 'people-groups-points',
        type: 'circle',
        source: 'people-groups',
        paint: {
          'circle-radius': CIRCLE_RADIUS,
          'circle-color': CIRCLE_COLOR,
          'circle-opacity': 0.85,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#faf7f0'
        }
      });

      map.on('click', 'people-groups-points', (e) => {
        setSelected(e.features[0].properties);
      });
      map.on('mouseenter', 'people-groups-points', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'people-groups-points', () => (map.getCanvas().style.cursor = ''));
    });

    return () => map.remove();
  }, []);

  return (
    <div className="map-wrapper">
      <div id="map-container" ref={mapContainer} />
      <MapLegend />
      {selected && <MapPopupCard properties={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
