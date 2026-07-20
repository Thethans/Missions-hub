import React, { useEffect, useRef } from 'react';
import mapPreview from '../data/mapPreview.json';

// A static preview of the real people-groups map for the homepage's
// MapTeaser section — every dot is a real, sampled coordinate + real
// progressStatus (see scripts/generate-map-preview.js), not a fabricated
// illustration. Same solid/faded/ring status encoding as the live map (see
// WorldMap.jsx CIRCLE_FILL_OPACITY) so it reads consistently once a visitor
// reaches /map.
//
// Drawn to a single canvas instead of one <circle> per dot (450 of them) —
// this graphic plus the hero's own dot field pushed the homepage past 1,300
// SVG circles in the prerendered HTML. No dot here is individually
// interactive, so the whole thing collapses to one draw call.

const DOT_RADIUS = 2.6;

// Mirrors src/styles.css .map-preview-dot.status-* rules exactly.
const STATUS_STYLE = {
  unreached: { fillVar: '--status-unreached', fillAlpha: 0.85 },
  formative: { fillVar: '--status-formative', fillAlpha: 0.55 },
  reached: { strokeVar: '--status-reached', strokeWidth: 1.5 }
};

function parseViewBox(viewBox) {
  const [minX, minY, width, height] = viewBox.split(' ').map(Number);
  return { minX, minY, width, height };
}

export default function MapPreviewGraphic() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    // Environments without a real 2d context (some test DOMs, canvas-
    // fingerprinting-blocking extensions) get an empty decorative layer
    // instead of a crash.
    if (!ctx) return;
    const { minX, minY, width: vbWidth, height: vbHeight } = parseViewBox(mapPreview.viewBox);
    const rootStyle = getComputedStyle(document.documentElement);
    const colors = {};
    for (const [status, cfg] of Object.entries(STATUS_STYLE)) {
      const varName = cfg.fillVar || cfg.strokeVar;
      colors[status] = rootStyle.getPropertyValue(varName).trim();
    }

    function draw() {
      const rect = canvas.getBoundingClientRect();
      const cssWidth = rect.width;
      const cssHeight = rect.height;
      if (!cssWidth || !cssHeight) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);

      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssWidth, cssHeight);

      // No preserveAspectRatio was set on the old <svg>, so it defaulted to
      // "xMidYMid meet" (contain/letterbox) — Math.min (not max) replicates
      // that here.
      const scale = Math.min(cssWidth / vbWidth, cssHeight / vbHeight);
      const offsetX = (cssWidth - vbWidth * scale) / 2;
      const offsetY = (cssHeight - vbHeight * scale) / 2;
      const r = DOT_RADIUS * scale;

      // Grouped by status so each status is one fill()/stroke() call (3
      // total) instead of one per dot.
      for (const [status, cfg] of Object.entries(STATUS_STYLE)) {
        ctx.beginPath();
        for (const d of mapPreview.dots) {
          if (d.s !== status) continue;
          const x = offsetX + (d.x - minX) * scale;
          const y = offsetY + (d.y - minY) * scale;
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        if (cfg.fillVar) {
          ctx.globalAlpha = cfg.fillAlpha;
          ctx.fillStyle = colors[status];
          ctx.fill();
        } else {
          ctx.globalAlpha = 1;
          ctx.strokeStyle = colors[status];
          ctx.lineWidth = cfg.strokeWidth * scale;
          ctx.stroke();
        }
      }
    }

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="map-preview-graphic"
      role="img"
      aria-label="Preview of the world map, showing real unreached, formative, and reached people-group locations"
    />
  );
}
