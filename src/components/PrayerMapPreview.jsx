import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import basemapStyle from '../map/basemapStyle.js';
import useMissionaries from '../features/prayer-map/hooks/useMissionaries.ts';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion.js';

/**
 * Landing-page teaser for /prayer-map — deliberately not a reskin of
 * PrayerWorldMap.tsx. That component is wired for the full gated
 * experience (click a pin, open a card, see prayer requests, sign in,
 * give); this one exists only to prove "real missionaries, real
 * locations" at a glance, so it's built from scratch with zero click
 * handlers, zero auth, and zero dependency on the sensitive-request or
 * payment code paths — a visitor can't accidentally reach anything
 * gated from here, because nothing gated is wired in at all.
 *
 * Reuses useMissionaries (already public/RLS-scoped to non-confidential
 * fields — see its own comment) rather than duplicating the fetch, and
 * the same basemapStyle.js every other map on the site uses, so the
 * visual language matches without touching either shared file.
 */
export default function PrayerMapPreview() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const { missionaries, loading } = useMissionaries();
  const [mapFailed, setMapFailed] = useState(false);
  const prefersReduced = usePrefersReducedMotion();

  useEffect(() => {
    if (!containerRef.current || loading) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: basemapStyle,
      center: [10, 15],
      zoom: 0.9,
      attributionControl: false,
      // No pan/zoom/rotate — a teaser, not a tool. Scroll-zoom in
      // particular would fight the page's own scroll.
      interactive: false
    });
    mapRef.current = map;

    // Same 20s backstop as WorldMap.jsx/PrayerWorldMap.tsx — matching their
    // proven value rather than picking a shorter one, since the external
    // tile source is the same known-flaky dependency all three maps share.
    const loadTimeout = window.setTimeout(() => setMapFailed(true), 20000);
    map.on('load', () => {
      window.clearTimeout(loadTimeout);
      map.resize();
    });
    map.on('error', (e) => {
      window.clearTimeout(loadTimeout);
      console.error('PrayerMapPreview: MapLibre error:', e.error);
      setMapFailed(true);
    });

    for (const m of missionaries) {
      if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng) || Math.abs(m.lat) > 90 || Math.abs(m.lng) > 180) {
        continue;
      }
      // A plain static dot — no <button>, no click listener, no aria-label
      // promising interactivity that isn't there. locationSensitive
      // missionaries still get the softer/larger "approximate area"
      // treatment rather than a precise pin, same privacy rule the real
      // map enforces, just reimplemented here rather than imported (this
      // file has no click/select plumbing for MissionaryPin.tsx's factories
      // to hook into).
      const el = document.createElement('span');
      el.className = m.locationSensitive ? 'pmp-dot pmp-dot--area' : 'pmp-dot';
      el.setAttribute('aria-hidden', 'true');
      new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([m.lng, m.lat]).addTo(map);
    }

    return () => {
      window.clearTimeout(loadTimeout);
      map.remove();
      mapRef.current = null;
    };
  }, [missionaries, loading]);

  return (
    <section className="pmp">
      <div className="pmp-content">
        <p className="pmp-kicker">Live from the field</p>
        <h2>Support, not just a map</h2>
        <p className="pmp-body">
          Every pin is a missionary a church somewhere is already praying for and giving toward — a
          preview of the full support map, where you can read their story and join in.
        </p>
        <p className="pmp-prototype-note">
          Prototype — sample data only, nothing here is real. <Link to="/about">Read more</Link>
        </p>
        <Link to="/prayer-map" className="cta-button cta-button--go">Explore the support map</Link>
      </div>
      <div className="pmp-visual" aria-hidden={mapFailed || loading}>
        {!mapFailed && <div className="pmp-map" ref={containerRef} />}
        {!prefersReduced && !mapFailed && <div className="pmp-vignette" />}
        {(loading) && !mapFailed && (
          <p className="map-loading" role="status">Loading the map&hellip;</p>
        )}
        {mapFailed && (
          <p className="map-data-error" role="alert">
            Couldn't load the map preview right now — <Link to="/prayer-map">open the full map</Link> instead.
          </p>
        )}
      </div>
    </section>
  );
}
