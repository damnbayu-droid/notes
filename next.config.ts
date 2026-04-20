import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack & SWC Optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Image Optimization Protocol (v15.0.0)
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Neural Performance Tuning
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  
  // Environment Benchmark Stabilization
  typescript: {
    ignoreBuildErrors: false,
  },

  // Turbopack configuration (Restored)
  turbopack: {
    // Custom rules can be added here
  }
};

export default nextConfig;
