import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Reuse the existing atlas basemap (demotiles vector source, no API key) rather
// than introducing a second map style. It's plain JS; allowJs lets TS infer it.
import basemapStyle from '../../../map/basemapStyle.js';
import type { Missionary } from '../data/types';
import { createMissionaryPinElement, createApproximatePinElement } from './MissionaryPin';

interface PrayerWorldMapProps {
  /** Fetched once by the parent (see useMissionaries) — this component only
   *  ever mounts after that fetch settles, so markers still build exactly
   *  once (SPEC §6), just against real data instead of a static import. */
  missionaries: Missionary[];
  /** Called with a missionary id when its pin is clicked. */
  onSelect: (id: string) => void;
  /** Currently open missionary, or null. Drives the flyTo. */
  selectedId: string | null;
}

export default function PrayerWorldMap({ missionaries, onSelect, selectedId }: PrayerWorldMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  // Hold the latest onSelect without making the map-build effect depend on it,
  // so markers are created exactly once (SPEC §6: build markers once).
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: basemapStyle as StyleSpecification,
      center: [10, 15],
      zoom: 1.4,
      attributionControl: { compact: true }
    });
    mapRef.current = map;

    // Markers are DOM overlays positioned by lng/lat — they don't depend on the
    // basemap style or tiles having loaded, so add them right away rather than
    // inside 'load'. (Gating on 'load' meant that if the external tile source
    // was slow or unreachable, the pins never appeared.)
    for (const m of missionaries) {
      // A single malformed record (e.g. out-of-range lat/lng from a typo in
      // the admin form) must not take down the whole map for every visitor —
      // MapLibre throws synchronously on an invalid LngLat, which would
      // otherwise abort this loop mid-way and trip the page's ErrorBoundary.
      if (!Number.isFinite(m.lat) || !Number.isFinite(m.lng) || Math.abs(m.lat) > 90 || Math.abs(m.lng) > 180) {
        console.error(`Skipping map pin for "${m.name}" (${m.id}): invalid coordinates [${m.lng}, ${m.lat}]`);
        continue;
      }
      try {
        const el = m.locationSensitive
          ? createApproximatePinElement(m, (id) => onSelectRef.current(id))
          : createMissionaryPinElement(m, (id) => onSelectRef.current(id));
        // MapLibre's Marker.addTo() unconditionally overwrites aria-label with
        // its own generic "Map marker" string, clobbering the descriptive label
        // set by the pin factory — reapply it after addTo() runs.
        const ariaLabel = el.getAttribute('aria-label');
        new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([m.lng, m.lat]).addTo(map);
        if (ariaLabel) el.setAttribute('aria-label', ariaLabel);
      } catch (err) {
        console.error(`Skipping map pin for "${m.name}" (${m.id}):`, err);
      }
    }

    // The container may not be at its final size the instant the map mounts
    // (e.g. right after a route change) — resize on load and on window resize.
    const onWindowResize = () => map.resize();
    window.addEventListener('resize', onWindowResize);

    map.on('load', () => map.resize());

    return () => {
      window.removeEventListener('resize', onWindowResize);
      map.remove();
      mapRef.current = null;
    };
    // missionaries only in the deps list for correctness — in practice this
    // still only ever runs once, since the parent doesn't mount this
    // component until the fetch settles (see PrayerMapPage.tsx), so the
    // prop is stable for this component's whole lifetime, same as the old
    // static import was.
  }, [missionaries]);

  // Glide to the selected pin when one opens (not on close). Creative-access
  // missionaries stay more zoomed out — flying in tight would still visually
  // read as "pinpointing" a location, even though the coordinate itself is a
  // deliberately generalized decoy point rather than a real one.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const m = missionaries.find((x) => x.id === selectedId);
    if (!m) return;
    // Sensitive missionaries cap the zoom (never zoom in past it, even if the
    // visitor was already closer from a previous selection); everyone else
    // zooms in to at least the normal target.
    const zoom = m.locationSensitive ? Math.min(map.getZoom(), 2.4) : Math.max(map.getZoom(), 3.2);
    map.flyTo({ center: [m.lng, m.lat], zoom, speed: 0.8 });
  }, [selectedId, missionaries]);

  return (
    <div className="pm-map-wrap">
      <div className="pm-map" ref={containerRef} />
      <div className="pm-vignette" aria-hidden="true" />
    </div>
  );
}
