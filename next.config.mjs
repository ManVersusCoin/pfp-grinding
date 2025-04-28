/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add custom headers to handle origin mismatch for Server Actions
  async headers() {
    return [
      {
        source: '/(.*)', // Apply to all routes
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Allow all origins (use specific origin in production for security)
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS', // Allow necessary HTTP methods
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-forwarded-host', // Include x-forwarded-host
          },
        ],
      },
    ];
  },
  // Enable experimental server actions if not already enabled by default
  experimental: {
    serverActions: true,
  },
};

export default nextConfig;