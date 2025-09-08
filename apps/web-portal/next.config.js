/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: false,
  output: 'standalone',
  trailingSlash: false,
  poweredByHeader: false,
  generateEtags: false,
  compiler: {
    styledJsx: false,
  },
  // Disable styled-jsx completely
  experimental: {
    esmExternals: false,
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
    forceSwcTransforms: true,
  },
  // Static export mode - removed invalid options
  // unstable_runtimeJS: false,
  // generateStaticParams: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Webpack config to handle styled-jsx
  webpack: (config, { isServer, dev }) => {
    // Completely exclude styled-jsx from both client and server
    config.resolve.alias = {
      ...config.resolve.alias,
      'styled-jsx': false,
      'styled-jsx/style': false,
    };
    
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'styled-jsx': false,
    };

    // Override Next.js default styled-jsx handling
    config.module.rules = config.module.rules.filter(rule => {
      if (rule.test && rule.test.toString().includes('styled-jsx')) {
        return false;
      }
      return true;
    });

    // Add externals to completely exclude styled-jsx
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push('styled-jsx');
      config.externals.push('styled-jsx/style');
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
  // Rewrites disabled for export mode
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `${process.env.API_BASE_URL || 'http://localhost:3001'}/:path*`,
  //     },
  //   ];
  // },
  // Headers disabled for export mode
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'X-Frame-Options',
  //           value: 'DENY',
  //         },
  //         {
  //           key: 'X-Content-Type-Options',
  //           value: 'nosniff',
  //         },
  //         {
  //           key: 'Referrer-Policy',
  //           value: 'strict-origin-when-cross-origin',
  //         },
  //       ],
  //     },
  //   ];
  // },
};

module.exports = nextConfig;