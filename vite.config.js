import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

// Fraunces/Inter load via @fontsource's `font-display: swap`, so the
// browser paints with a fallback font first and reflows once the webfont
// arrives — Lighthouse traced this swap as the largest CLS contributor on
// every route (footer position shifting as heading/body font metrics
// change). The CSS `url()` reference alone isn't enough for the browser to
// start fetching these before it parses the (render-blocking) stylesheet,
// so preload the two variable-font files the whole site depends on to pull
// the fetch forward and shrink the fallback-to-webfont gap.
function preloadCriticalFonts() {
  const critical = [/fraunces-latin-full-normal-.*\.woff2$/, /inter-latin-wght-normal-.*\.woff2$/];
  return {
    name: 'preload-critical-fonts',
    transformIndexHtml: {
      order: 'post',
      handler(_, { bundle }) {
        if (!bundle) return [];
        const fontFiles = Object.values(bundle).filter(
          (f) => f.type === 'asset' && critical.some((re) => re.test(f.fileName))
        );
        return fontFiles.map((f) => ({
          tag: 'link',
          injectTo: 'head',
          attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${f.fileName}`, crossorigin: true }
        }));
      }
    }
  };
}

// Opt-in via `ANALYZE=true npm run build` — a stats.html bundle breakdown is
// dev/audit tooling, not something every production build should pay the
// extra plugin cost for.
const plugins = [react(), preloadCriticalFonts()];
if (process.env.ANALYZE === 'true') {
  plugins.push(visualizer({ filename: 'dist/stats.html', gzipSize: true, brotliSize: true, template: 'treemap' }));
}

export default defineConfig({
  plugins,
  server: {
    port: Number(process.env.PORT) || 5173
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Split the big, slow-changing libraries into their own chunks so
        // the browser can fetch them in parallel with the app code, and so
        // a future deploy that only touches app code doesn't invalidate the
        // cached vendor/motion chunks for returning visitors.
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
          // Without this, Rollup's automatic shared-chunk naming picked
          // "basemapStyle" (the smallest/first module in the shared graph)
          // to name a chunk that's actually maplibre-gl's own ~800KB
          // production bundle — misleading in any bundle-size report. Naming
          // it explicitly doesn't change what's in it, just what it's called;
          // it was already split into its own chunk (only fetched on /map)
          // before this.
          maplibre: ['maplibre-gl']
        }
      }
    }
  }
});
