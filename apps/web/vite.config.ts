import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Block Builder',
        short_name: 'Block Builder',
        description: 'Visual API & UI Code Generator',
        theme_color: '#185FA5',
        background_color: '#fafaf8',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
        categories: ['developer tools', 'productivity'],
        shortcuts: [
          {
            name: '新增專案',
            url: '/?action=new',
            description: '建立新的 Block Builder 專案',
          },
        ],
      },
      workbox: {
        // Cache strategy for different resource types
        runtimeCaching: [
          {
            // Monaco Editor workers (large, cache aggressively)
            urlPattern: /monaco-editor/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'monaco-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            // CDN libraries (faker.js for preview)
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-libs',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Block Builder API — network first, fallback to cache
            urlPattern: /\/api\/generate/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-generate',
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Auth endpoints — network only (never cache)
            urlPattern: /\/(auth|api\/projects)/,
            handler: 'NetworkOnly',
          },
        ],
        // Pre-cache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Don't cache these
        globIgnores: ['**/node_modules/**', '**/sw.js'],
        // Max cache size
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
        skipWaiting: true,
        clientsClaim: true,
        // Clean old caches
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false, // Disable SW in dev to avoid confusion
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // No manualChunks - let Vite handle chunking automatically
        // This prevents React duplicate instance issues in Electron
      },
    },
  },
})
