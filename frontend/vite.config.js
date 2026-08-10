import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const defaultApiUrl = mode === 'production' 
    ? 'https://rms-backend.onrender.com/api' 
    : 'http://localhost:5000/api';

  return {
    plugins: [
      tailwindcss(),
      react(),
    ],
    server: {
      port: 5173,
      strictPort: true,
      host: true
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || defaultApiUrl)
    }
  }
})
