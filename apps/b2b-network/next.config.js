/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@ofw-realty/api-client', '@ofw-realty/utils'],
  images: { domains: ['images.unsplash.com', 'eewdelfbvkdgbiovsbvr.supabase.co'] },
}
module.exports = nextConfig
