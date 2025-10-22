import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.PORT || 3000,  // Use Render's provided PORT or fallback to 3000
    host: '0.0.0.0',  // Bind to all network interfaces
    open: true,
    allowedHosts: [
      'ai-debate-analyzer-2.onrender.com', // Add your Render domain here
      'localhost', // You can also allow localhost for local testing
    ],
  },
  build: {
    outDir: 'dist',
  },
})
