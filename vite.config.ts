import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import viteCompression from "vite-plugin-compression"


// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  base: '/',
  plugins: [
    react(),
    // Gzip Compression (Sustainability: smaller payloads)
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Brotli Compression (Sustainability: even smaller payloads)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Hardening: Drop all console and debugger statements in production
    drop: ['console', 'debugger'],
  },
  build: {
    // Target modern browsers
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
    minify: 'esbuild',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    sourcemap: false,
  },
});
