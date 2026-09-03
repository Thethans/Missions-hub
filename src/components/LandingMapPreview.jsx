import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import darkTerrainStyle from '../map/darkTerrainStyle.js';
import LandingMapHeader from './LandingMapHeader.jsx';
import QuizCTA from './QuizCTA.jsx';

const DATA_URL = '/data/people-groups.geojson';
const SOURCE_ID = 'landing-preview-points';

// Native MapLibre clustering (cluster: true on the source) instead of a
// hand-rolled clustering pass — MapLibre already buckets points per tile/
// zoom and exposes point_count on each cluster feature, and degrades to
// individual points above clusterMaxZoom for free.
const CLUSTER_RADIUS_STOPS = ['step', ['get', 'point_count'], 14, 25, 20, 100, 28, 750, 36];
const CLUSTER_COLOR_STOPS = ['step', ['get', 'point_count'], '#d98e5c', 25, '#e0793b', 100, '#e0793b'];

// A light lat/lon grid, same idea as WorldMap.jsx's buildGraticule() — the
// "subtle contour texture" darkTerrainStyle.js's own comment flags as a
// stand-in for real elevation data.
function buildGraticule() {
  const features = [];
  for (let lon = -180; lon <= 180; lon += 30) {
    features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[lon, -70], [lon, 70]] } });
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: [[-180, lat], [180, lat]] } });
  }
  return { type: 'FeatureCollection', features };
}

export default function LandingMapPreview() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [countries, setCountries] = useState([]);
  const [dataError, setDataError] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: darkTerrainStyle,
      center: [10, 15],
      zoom: 1.2,
      attributionControl: false
    });
    mapRef.current = map;

    // Same backstop as WorldMap.jsx: 'load'/'error' can both fail to fire at
    // all under WebGL context pressure.
    const loadTimeout = window.setTimeout(() => {
      console.error('LandingMapPreview: MapLibre never fired load or error within 20s');
      setLoadTimedOut(true);
    }, 20000);

    map.on('error', (e) => {
      window.clearTimeout(loadTimeout);
      console.error('LandingMapPreview: MapLibre error:', e.error);
      setTileError(true);
    });

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
        console.error('LandingMapPreview: could not load people-groups.geojson', e);
        setDataError(true);
        return;
      }

      map.addSource('graticule', { type: 'geojson', data: buildGraticule() });
      map.addLayer({
        id: 'graticule-lines',
        type: 'line',
        source: 'graticule',
        paint: { 'line-color': 'rgba(250, 247, 240, 0.06)', 'line-width': 1 }
      }, 'countries-label');

      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data,
        cluster: true,
        clusterMaxZoom: 8,
        clusterRadius: 50
      });

      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': CLUSTER_COLOR_STOPS,
          'circle-radius': CLUSTER_RADIUS_STOPS,
          'circle-opacity': 0.85,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(250, 247, 240, 0.25)'
        }
      });

      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Open Sans Semibold'],
          'text-size': 12
        },
        paint: { 'text-color': '#16233b' }
      });

      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 3.5,
          'circle-color': '#d98e5c',
          'circle-opacity': 0.75,
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgba(250, 247, 240, 0.3)'
        }
      });

      // Standard MapLibre native-cluster expansion: zoom to the level a
      // cluster would first start splitting apart, rather than a fixed
      // zoom-in step — keeps clicking a huge cluster from re-landing on
      // another single giant cluster.
      map.on('click', 'clusters', (e) => {
        const feature = e.features[0];
        const clusterId = feature.properties.cluster_id;
        map.getSource(SOURCE_ID).getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: feature.geometry.coordinates, zoom });
        });
      });
      map.on('mouseenter', 'clusters', () => (map.getCanvas().style.cursor = 'pointer'));
      map.on('mouseleave', 'clusters', () => (map.getCanvas().style.cursor = ''));

      // Real distinct country list from the loaded data, for
      // LandingMapHeader's "Explore by Country" select — not hardcoded.
      const byCountry = new Map();
      data.features.forEach((f) => {
        const country = f.properties?.country;
        if (country && !byCountry.has(country)) byCountry.set(country, f.geometry.coordinates);
      });
      setCountries([...byCountry.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, coordinates]) => ({ name, coordinates })));
      setReady(true);
    });

    return () => {
      window.clearTimeout(loadTimeout);
      window.removeEventListener('resize', onWindowResize);
      map.remove();
    };
  }, []);

  const flyToCountry = (coordinates) => {
    mapRef.current?.flyTo({ center: coordinates, zoom: 5, speed: 0.8 });
  };

  return (
    <section className="landing-map">
      <div className="landing-map-wrapper">
        <div className="landing-map-canvas" ref={mapContainer} data-hydration-reset="children class style" />
        <div className="landing-map-vignette" aria-hidden="true" />
        <LandingMapHeader countries={countries} onSelectCountry={flyToCountry} />
        {tileError ? (
          <p className="landing-map-status" role="alert">Couldn't load the map right now — try refreshing the page.</p>
        ) : dataError ? (
          <p className="landing-map-status" role="alert">Couldn't load people-group data right now — try refreshing the page.</p>
        ) : loadTimedOut ? (
          <p className="landing-map-status" role="alert">The map is taking longer than expected to load — try refreshing the page.</p>
        ) : !ready ? (
          <p className="landing-map-status" role="status">Loading the map&hellip;</p>
        ) : null}
      </div>
      <QuizCTA />
    </section>
  );
}
