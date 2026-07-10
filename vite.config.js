import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
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
