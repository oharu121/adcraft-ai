import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker optimization
  output: 'standalone',
  
  // Disable strict ESLint during build for Docker compatibility
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checking during build (will be done separately)
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  
  // Optimize for production deployment
  experimental: {
    // Enable optimized package imports for better tree shaking
    optimizePackageImports: ['@google-cloud/aiplatform', '@google-cloud/storage', '@google-cloud/firestore'],
  },
  
  // Configure image optimization for production
  images: {
    domains: ['storage.googleapis.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Comprehensive security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME-type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Comprehensive Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://storage.googleapis.com https://commondatastorage.googleapis.com",
              "media-src 'self' blob: https://storage.googleapis.com https://commondatastorage.googleapis.com",
              "connect-src 'self' https://generativelanguage.googleapis.com https://aiplatform.googleapis.com https://*.googleapis.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          // HTTPS Strict Transport Security
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Permissions Policy (Feature Policy)
          {
            key: 'Permissions-Policy',
            value: [
              'geolocation=()',
              'camera=()',
              'microphone=()',
              'payment=()',
              'usb=()',
              'magnetometer=()',
              'gyroscope=()',
              'speaker-selection=()',
              'display-capture=()',
              'fullscreen=(self)'
            ].join(', ')
          },
          // Cross-Origin policies
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          // Additional security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // API routes specific headers
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
