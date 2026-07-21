import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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

export default defineConfig({
  plugins: [react(), preloadCriticalFonts()],
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
          motion: ['framer-motion']
        }
      }
    }
  }
});
