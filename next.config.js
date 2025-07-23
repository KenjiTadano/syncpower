/\*_ @type {import('next').NextConfig} _/;
const nextConfig = {
  reactStrictMode: true,
  env: {
    OSHIRAKU_API_KEY: process.env.OSHIRAKU_API_KEY,
  },
};

module.exports = nextConfig;
