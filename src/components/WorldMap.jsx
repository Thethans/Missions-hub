import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// Free demo vector basemap — no API key needed. Swap for MapTiler/Protomaps later if desired.
const BASEMAP_STYLE = 'https://demotiles.maplibre.org/style.json';
const DATA_URL = '/data/people-groups.geojson';

export default function WorldMap() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: BASEMAP_STYLE,
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

      map.addLayer({
        id: 'people-groups-points',
        type: 'circle',
        source: 'people-groups',
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'population'], 1000, 3, 5000000, 14],
          'circle-color': [
            'match',
            ['get', 'progressStatus'],
            'unreached', '#8a2c1d',
            'formative', '#c98a3a',
            'reached', '#4a7a52',
            '#999999'
          ],
          'circle-opacity': 0.75,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#fff'
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
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: 6,
            padding: '1rem',
            maxWidth: 280,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <button style={{ float: 'right', border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setSelected(null)}>
            ✕
          </button>
          <h3 style={{ marginTop: 0 }}>{selected.name}</h3>
          <p><strong>Country:</strong> {selected.country}</p>
          <p><strong>Population:</strong> {Number(selected.population).toLocaleString()}</p>
          <p><strong>% Evangelical:</strong> {selected.pctEvangelical}%</p>
          <p><strong>Status:</strong> {selected.progressStatus}</p>
          <p><strong>Primary religion:</strong> {selected.religion}</p>
        </div>
      )}
    </div>
  );
}
