/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  // Remove output mode to use default
  trailingSlash: false,
  poweredByHeader: false,
  generateEtags: false,
  images: {
    unoptimized: true,
  },
  // Disable styled-jsx completely
  experimental: {
    esmExternals: false,
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    forceSwcTransforms: true,
  },
  // Disable styled-jsx through compiler options
  compiler: {
    styledComponents: false,
    removeConsole: false,
  },
  // Skip middleware and use client-side routing only
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  // Static export mode - removed invalid options
  // unstable_runtimeJS: false,
  // generateStaticParams: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Webpack config to properly handle styled-jsx during SSG
  webpack: (config, { isServer, dev }) => {
    // Completely replace styled-jsx with mock to prevent errors
    config.resolve.alias = {
      ...config.resolve.alias,
      'styled-jsx': require.resolve('./src/utils/styled-jsx-mock.js'),
      'styled-jsx/style': require.resolve('./src/utils/styled-jsx-mock.js'),
      'styled-jsx/server': require.resolve('./src/utils/styled-jsx-mock.js'),
    };
    
    return config;
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'investment-platform-secret',
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
    PORTFOLIO_SERVICE_URL: process.env.PORTFOLIO_SERVICE_URL || 'http://localhost:3001',
    AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || 'http://localhost:3002',
    MARKET_DATA_SERVICE_URL: process.env.MARKET_DATA_SERVICE_URL || 'http://localhost:3003',
  },
  // API rewrites for development
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL || 'http://localhost:3001'}/:path*`,
      },
    ];
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;