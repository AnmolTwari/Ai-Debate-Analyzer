import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT || 3000,  // Use the Render-provided PORT or fallback to 3000
    host: '0.0.0.0',  // Bind to all network interfaces to expose the app
    open: true
  },
  build: {
    outDir: 'dist'
  }
})
