/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    minimumCacheTTL: 604800, // 7 días para imágenes optimizadas
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sigmincetur.mincetur.gob.pe',
      },
      {
        protocol: 'https',
        hostname: 'consultasenlinea.mincetur.gob.pe',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

module.exports = nextConfig;

