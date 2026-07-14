import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Reuse the existing atlas basemap (demotiles vector source, no API key) rather
// than introducing a second map style. It's plain JS; allowJs lets TS infer it.
import basemapStyle from '../../../map/basemapStyle.js';
import { missionaries } from '../data/missionaries';
import { createMissionaryPinElement } from './MissionaryPin';

interface PrayerWorldMapProps {
  /** Called with a missionary id when its pin is clicked. */
  onSelect: (id: string) => void;
  /** Currently open missionary, or null. Drives the flyTo. */
  selectedId: string | null;
}

export default function PrayerWorldMap({ onSelect, selectedId }: PrayerWorldMapProps) {
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
      const el = createMissionaryPinElement(m, (id) => onSelectRef.current(id));
      new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([m.lng, m.lat]).addTo(map);
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
  }, []);

  // Glide to the selected pin when one opens (not on close).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const m = missionaries.find((x) => x.id === selectedId);
    if (!m) return;
    map.flyTo({ center: [m.lng, m.lat], zoom: Math.max(map.getZoom(), 3.2), speed: 0.8 });
  }, [selectedId]);

  return (
    <div className="pm-map-wrap">
      <div className="pm-map" ref={containerRef} />
      <div className="pm-vignette" aria-hidden="true" />
    </div>
  );
}
