/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  // Try development mode to skip static optimization
  output: 'standalone',
  trailingSlash: false,
  poweredByHeader: false,
  generateEtags: false,
  compiler: {
    styledJsx: false,
  },
  experimental: {
    esmExternals: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Webpack config to handle styled-jsx
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude styled-jsx from client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'styled-jsx': false,
      };
    }
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
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_BASE_URL || 'http://localhost:3001'}/:path*`,
      },
    ];
  },
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