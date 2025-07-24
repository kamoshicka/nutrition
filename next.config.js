/** @type {import('next').NextConfig} */
const nextConfig = {
  // App Router is no longer experimental in Next.js 14
  images: {
    domains: ['example.com'], // Add any domains you need for external images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Enable SWC minification for faster builds
  swcMinify: true,
  // Configure Content Security Policy
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  // Configure compression
  compress: true,
  // Configure webpack for performance
  webpack: (config, { dev, isServer }) => {
    // Optimize for production builds
    if (!dev && !isServer) {
      // Enable tree shaking and chunk optimization
      config.optimization.splitChunks.chunks = 'all';
      config.optimization.minimize = true;
    }
    return config;
  },
}

module.exports = nextConfig