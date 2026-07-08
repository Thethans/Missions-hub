import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import RevealOnScroll from './RevealOnScroll.jsx';

const BASEMAP_STYLE = 'https://demotiles.maplibre.org/style.json';
const DATA_URL = '/data/people-groups.geojson';

export default function MapTeaser() {
  const mapContainer = useRef(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: BASEMAP_STYLE,
      center: [20, 15],
      zoom: 1,
      interactive: false,
      attributionControl: false
    });

    map.on('load', async () => {
      try {
        const res = await fetch(DATA_URL);
        const data = await res.json();
        map.addSource('people-groups-teaser', { type: 'geojson', data });
        map.addLayer({
          id: 'people-groups-teaser-points',
          type: 'circle',
          source: 'people-groups-teaser',
          paint: {
            'circle-radius': 3,
            'circle-color': [
              'match',
              ['get', 'progressStatus'],
              'unreached', '#b5482f',
              'formative', '#d9a441',
              'reached', '#4c8a5e',
              '#999999'
            ],
            'circle-opacity': 0.75
          }
        });
      } catch {
        /* teaser is decorative — fail silently if data isn't available */
      }
    });

    return () => map.remove();
  }, []);

  return (
    <RevealOnScroll className="map-teaser">
      <div className="map-teaser-preview" ref={mapContainer} />
      <div className="map-teaser-copy">
        <h2>See where the need is</h2>
        <p>Explore an interactive map of unreached and under-resourced people groups worldwide.</p>
        <Link to="/map" className="cta-button">Explore the full map</Link>
      </div>
    </RevealOnScroll>
  );
}
