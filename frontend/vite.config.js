import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  let apiUrl = process.env.VITE_API_URL || '';
  if (!apiUrl || apiUrl.includes('f-hms') || apiUrl.includes('ERR_NAME_NOT_RESOLVED')) {
    apiUrl = mode === 'production' 
      ? 'https://rms-backend.onrender.com/api' 
      : 'http://localhost:5000/api';
  }

  return {
    plugins: [
      tailwindcss(),
      react(),
    ],
    server: {
      port: 5173,
      strictPort: false,
      host: true
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl)
    }
  }
})
