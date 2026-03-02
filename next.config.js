/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr', 'svix'],
  },
  async rewrites() {
    return [
      {
        source: '/Mountanvildemo',
        destination: '/demo',
      },
      {
        source: '/Mountanvildemo/:path*',
        destination: '/demo/:path*',
      },
    ]
  },
}

module.exports = nextConfig
