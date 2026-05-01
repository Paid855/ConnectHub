/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https: blob:; worker-src 'self' blob:; connect-src 'self' https: wss:; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:; media-src 'self' blob: https: mediastream:; frame-src 'self' https:",
          },
        ],
      },
    ];
  },
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
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  serverExternalPackages: ["cloudinary"],
};

export default nextConfig;
