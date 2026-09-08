import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true // Lets you test the app installation locally on your laptop!
      },
      manifest: {
        name: 'Team Tesla: Smart Spoon AI',
        short_name: 'Smart Spoon',
        description: 'Real-time milk adulteration telemetry and diagnostic engine.',
        theme_color: '#020617', // Deep slate-950 to match your UI
        background_color: '#020617',
        display: 'standalone', // THIS is what hides the Google Chrome search bars!
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})