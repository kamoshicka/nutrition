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
  // Production optimizations
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  
  // Configure Content Security Policy and Security Headers
  headers: async () => {
    const isProduction = process.env.NODE_ENV === 'production';
    const forceHttps = process.env.FORCE_HTTPS === 'true';
    
    const securityHeaders = [
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
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ];
    
    // Add HSTS header in production with HTTPS
    if (isProduction && forceHttps) {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload',
      });
    }
    
    // Add CSP header
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.stripe.com https://www.google-analytics.com",
      "frame-src 'self' https://js.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ];
    
    securityHeaders.push({
      key: 'Content-Security-Policy',
      value: cspDirectives.join('; '),
    });
    
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Cache static assets
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache API responses appropriately
      {
        source: '/api/health',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Configure redirects for HTTPS enforcement
  redirects: async () => {
    const forceHttps = process.env.FORCE_HTTPS === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction && forceHttps) {
      return [
        {
          source: '/(.*)',
          has: [
            {
              type: 'header',
              key: 'x-forwarded-proto',
              value: 'http',
            },
          ],
          destination: 'https://your-domain.com/$1',
          permanent: true,
        },
      ];
    }
    
    return [];
  },
  
  // Configure webpack for performance
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      // Enable tree shaking and chunk optimization
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      };
      
      // Minimize bundle size
      config.optimization.minimize = true;
      
      // Remove console.log in production (keep console.error and console.warn)
      if (!isServer && config.optimization.minimizer && config.optimization.minimizer[0]) {
        const minimizer = config.optimization.minimizer[0];
        if (minimizer.options && minimizer.options.minimizer && minimizer.options.minimizer.options) {
          minimizer.options.minimizer.options.compress = {
            ...minimizer.options.minimizer.options.compress,
            drop_console: true,
            pure_funcs: [
              'console.log',
              'console.info',
              'console.debug',
            ]
          };
        }
      }
    }
    
    // Bundle analyzer (uncomment to analyze bundle size)
    // if (!dev && !isServer && process.env.ANALYZE === 'true') {
    //   const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
    //   config.plugins.push(
    //     new BundleAnalyzerPlugin({
    //       analyzerMode: 'static',
    //       openAnalyzer: false,
    //     })
    //   );
    // }
    
    return config;
  },
  
  // Environment variables to expose to the client
  env: {
    // Only include environment variables that should be exposed to the client
    // CUSTOM_KEY: process.env.CUSTOM_KEY || '',
  },
  
  // Experimental features for performance
  experimental: {
    // Enable modern JavaScript features
    esmExternals: true,
    // Optimize server components
    serverComponentsExternalPackages: ['sqlite3', 'sqlite'],
    // Disable CSS optimization to avoid critters error
    optimizeCss: false,
  },
  
  // Output configuration for deployment (disable for now to use npm start)
  // output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig