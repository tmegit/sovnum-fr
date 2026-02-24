import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Redirige toutes les routes vers index.html (SPA)
    historyApiFallback: true,
  },
})
