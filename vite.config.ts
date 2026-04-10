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
    // Target modern browsers — es2020 enables native optional chaining/nullish
    // which produces smaller output than es2015 transpilation.
    target: 'es2020',

    // Increase warning threshold (we know media libs are heavy, they're lazy)
    chunkSizeWarningLimit: 2000,

    // esbuild minification (fastest, default in Vite 5+)
    minify: 'esbuild',

    // CSS code splitting — each async chunk carries only its own CSS
    cssCodeSplit: true,

    rollupOptions: {
      output: {
        // Deterministic file names for long-term caching
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',

        manualChunks(id) {
          // ─── CRITICAL PATH (loads synchronously on first paint) ───────────
          // These are small and needed immediately — keep in one chunk
          if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router-dom')) {
            return 'react-vendor';
          }

          // ─── UI PRIMITIVES (needed as soon as Dashboard mounts) ──────────
          if (id.includes('@radix-ui/')) {
            return 'ui-vendor';
          }

          // ─── SUPABASE (auth check happens early, keep near critical path) ─
          if (id.includes('@supabase/')) {
            return 'supabase-vendor';
          }

          // ─── UTILITIES (small, widely used) ──────────────────────────────
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('tailwind-merge')) {
            return 'utils-vendor';
          }

          // ─── HEAVY MEDIA LIBS — kept separate so they're LAZY loaded ─────
          // These are only used in ScannerPage/BookLayout — never on initial load
          if (id.includes('pdf-lib') || id.includes('jspdf') || id.includes('html2canvas')) {
            return 'media-vendor';
          }

          // ─── IMAGE COMPRESSION — lazy (only on note image upload) ─────────
          if (id.includes('browser-image-compression')) {
            return 'image-vendor';
          }

          // ─── AI — lazy (AI assistant, not on initial load) ───────────────
          if (id.includes('openai') || id.includes('ai-vendor')) {
            return 'ai-vendor';
          }

          // ─── SIGNATURE / CANVAS — lazy (only in NoteEditor canvas mode) ──
          if (id.includes('signature_pad') || id.includes('react-signature')) {
            return 'canvas-vendor';
          }

          // ─── DOMPurify — lazy (sanitization, only when sharing notes) ────
          if (id.includes('dompurify') || id.includes('purify')) {
            return 'security-vendor';
          }
        },
      },
    },

    // No sourcemaps in production
    sourcemap: false,
  },

  // Pre-bundle only the critical-path dependencies for dev server speed
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'clsx',
      'tailwind-merge',
      'pdf-lib',
      'pako',
    ],
    // Exclude heavy libs from pre-bundling — they're lazy loaded
    exclude: [
      'jspdf',
      'html2canvas',
      'browser-image-compression',
    ],
  },
});
