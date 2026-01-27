import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'universum. Развитие. Для каждого',
        short_name: 'universum',
        description: 'universum. Развитие. Для каждого — платформа комплексной поддержки детей',
        theme_color: '#003366',
        background_color: '#f5f7fa',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '64x64 32x32 24x24 16x16',
            type: 'image/x-icon'
          }
        ]
      },
      workbox: {
        // Cache static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Runtime caching strategies
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/oxyjmeslnmhewlpgzlmf\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize chunk splitting to reduce unused JS
    rollupOptions: {
      output: {
        manualChunks: {
          // React MUST be in a single vendor chunk to ensure it loads first
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          // Supabase - loaded on demand
          'supabase': ['@supabase/supabase-js'],
          // TanStack Query
          'query': ['@tanstack/react-query'],
          // Radix UI components
          'ui-dialogs': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-alert-dialog'
          ],
          'ui-selects': [
            '@radix-ui/react-select',
            '@radix-ui/react-dropdown-menu'
          ],
          // Form libraries
          'form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Charts - heavy, load on demand
          'charts': ['recharts'],
          // PDF/Export - heavy, load on demand
          'export': ['jspdf', 'html2canvas', 'xlsx'],
          // Date utilities
          'date-utils': ['date-fns'],
        },
      },
    },
    // Use esbuild for minification (faster and no extra dependencies)
    minify: 'esbuild',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Increase chunk size warning limit for better splitting
    chunkSizeWarningLimit: 500,
    // Target modern browsers for smaller output
    target: 'es2020',
    // Generate modulepreload links for better loading
    modulePreload: {
      polyfill: true,
    },
  },
}));
