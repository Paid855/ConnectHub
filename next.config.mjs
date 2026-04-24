/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; worker-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com https://*.neon.tech; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com data:; media-src 'self' blob:;",
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
};

export default nextConfig;
