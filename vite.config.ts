import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
// Config updated to trigger restart for new dependencies
export default defineConfig({
  base: './',
  plugins: [
    inspectAttr(),
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2015',
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Use esbuild for faster minification (built into Vite)
    minify: 'esbuild',
    // Manual chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI library
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-switch',
          ],
          // Utilities
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge'],
          // PDF and image processing
          'media-vendor': ['pdf-lib', 'browser-image-compression', 'jspdf'],
          // Supabase and auth
          'supabase-vendor': ['@supabase/supabase-js'],
          // AI
          'ai-vendor': ['openai'],
        },
      },
    },
    // Source maps for debugging (disable in production for smaller size)
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
    ],
  },
});
