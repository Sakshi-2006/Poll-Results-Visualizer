import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // Split large vendor deps into separate chunks so esbuild minifies
    // smaller files instead of one oversized bundle (avoids the
    // "The service was stopped" minification failure under memory limits).
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts')) return 'recharts';
          if (id.includes('/d3-') || id.includes('victory-vendor')) return 'd3';
          if (id.includes('es-toolkit')) return 'es-toolkit';
          if (id.includes('react-dom') || id.includes('/react/')) return 'react';
          if (id.includes('lucide-react')) return 'icons';
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});
