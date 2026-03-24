/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: false,
  images: { unoptimized: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
