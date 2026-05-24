import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  allowedHosts: [
        'compassionate-radiance-production-b389.up.railway.app'
      ]
})
