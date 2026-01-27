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
  // CRITICAL: Force Vite to pre-bundle React dependencies together
  // This prevents multiple React instances causing "dispatcher.useEffect" errors
  optimizeDeps: {
    // Force re-optimization to clear corrupted cache
    force: true,
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      '@tanstack/react-query',
      'react-router-dom',
      'scheduler',
    ],
    esbuildOptions: {
      jsx: 'automatic',
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Dedupe React to prevent multiple instances
    dedupe: ['react', 'react-dom'],
  },
  build: {
    // Optimize chunk splitting - use function to avoid React duplication
    rollupOptions: {
      output: {
        manualChunks: {
          // CRITICAL: All React-related modules MUST be in the same chunk
          // to avoid "forwardRef" and "dispatcher.useEffect" errors
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            'scheduler',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
          ],
          supabase: ['@supabase/supabase-js'],
          query: ['@tanstack/react-query'],
          // Charts include recharts which uses React - must NOT be separate
          // Moved to main bundle to avoid React version conflicts
          'date-utils': ['date-fns'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-tooltip'],
          form: ['react-hook-form', '@hookform/resolvers', 'zod'],
          export: ['jspdf', 'html2canvas', 'xlsx'],
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
