/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: 'output: export' was removed to enable API Routes
  // API Routes are required for secure server-side IPFS uploads via Pinata proxy
  // This means the app now requires a Node.js server (Vercel, self-hosted, etc.)
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
