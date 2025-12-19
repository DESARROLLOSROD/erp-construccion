/** @type {import('next').NextConfig} */
const nextConfig = {
  // Imágenes externas permitidas (logos, avatars)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

module.exports = nextConfig
