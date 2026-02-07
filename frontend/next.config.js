/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // TS errors won't block the build
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
