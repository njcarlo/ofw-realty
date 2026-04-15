/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@ofw-realty/ui',
    '@ofw-realty/map',
    '@ofw-realty/auth',
    '@ofw-realty/utils',
    '@ofw-realty/api-client',
  ],
  async redirects() {
    return [
      // In production, redirect bare lupa.ph → portal.lupa.ph
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'lupa.ph' }],
        destination: 'https://portal.lupa.ph/:path*',
        permanent: false,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.lupa.ph' }],
        destination: 'https://portal.lupa.ph/:path*',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
