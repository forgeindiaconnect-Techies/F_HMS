import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'https://f-hms-1.onrender.com/api';
  const restaurantUrl = env.VITE_RESTAURANT_URL || 'http://localhost:5173';

  return {
    plugins: [
      tailwindcss(),
      react(),
    ],
    server: {
      port: 5174,
      strictPort: false,
      host: true
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
      'import.meta.env.VITE_RESTAURANT_URL': JSON.stringify(restaurantUrl)
    },
    build: {
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('recharts') || id.includes('d3') || id.includes('chart')) {
                return 'vendor-charts';
              }
              return 'vendor-libs';
            }
          }
        }
      }
    }
  }
})
