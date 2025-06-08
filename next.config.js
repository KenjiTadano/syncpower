/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    appDir: true,
  },
  experimental: {
    asyncContext: true,
  },
};

module.exports = nextConfig;
