import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'https://backend-ochre-five-29.vercel.app';
  const restaurantUrl = env.VITE_RESTAURANT_URL || '';

  return {
    plugins: [
      tailwindcss(),
      react(),
    ],
    resolve: {
      alias: {
        'react-router/dom': path.resolve(__dirname, 'node_modules/react-router/dist/production/dom-export.js'),
        'react-router': path.resolve(__dirname, 'node_modules/react-router/dist/production/index.js'),
        'react-hook-form': path.resolve(__dirname, 'node_modules/react-hook-form/dist/index.cjs.js'),
      }
    },
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
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('react-router')) {
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
