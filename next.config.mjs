/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://*.agora.io https://*.agoraio.cn; worker-src 'self' blob:; connect-src 'self' https://cdn.jsdelivr.net https://storage.googleapis.com https://*.neon.tech https://*.agora.io https://*.agoraio.cn https://*.edge.agora.io wss://*.agora.io wss://*.agoraio.cn https://ipapi.co https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; media-src 'self' blob: https:;",
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
