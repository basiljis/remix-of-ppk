import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
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
        manualChunks(id) {
          // React core - smallest possible chunk
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // React Router - separate for route-based splitting
          if (id.includes('react-router')) {
            return 'router';
          }
          // Supabase - loaded on demand
          if (id.includes('@supabase')) {
            return 'supabase';
          }
          // TanStack Query
          if (id.includes('@tanstack/react-query')) {
            return 'query';
          }
          // Radix UI components - split into smaller chunks
          if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-alert-dialog')) {
            return 'ui-dialogs';
          }
          if (id.includes('@radix-ui/react-select') || id.includes('@radix-ui/react-dropdown')) {
            return 'ui-selects';
          }
          if (id.includes('@radix-ui')) {
            return 'ui-primitives';
          }
          // Form libraries
          if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
            return 'form';
          }
          // Charts - heavy, load on demand
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts';
          }
          // PDF/Export - heavy, load on demand
          if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('xlsx')) {
            return 'export';
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'date-utils';
          }
          // Lucide icons - split separately
          if (id.includes('lucide-react')) {
            return 'icons';
          }
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
