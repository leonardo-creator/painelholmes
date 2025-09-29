import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@tanstack/react-table', '@tanstack/table-core'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app'],
    },
  },
  images: {
    domains: ['srv998107.hstgr.cloud'],
  },
}

export default nextConfig