/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // UploadThing CDN domains (utfs.io is legacy, ufs.sh is the newer CDN)
      {
        protocol: 'https',
        hostname: 'utfs.io',
      },
      {
        protocol: 'https',
        hostname: 'uploadthing.com',
      },
      {
        protocol: 'https',
        hostname: '*.ufs.sh', // UploadThing's newer CDN subdomain — fixes avatar 400s on Vercel
      },
      {
        protocol: 'https',
        hostname: 'ufs.sh',
      },
      // Google OAuth profile photos (Kinde users with Google accounts)
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
