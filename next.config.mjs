/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "staging.paybyapis.com",
      },
      {
        protocol: "https",
        hostname: "paybyapis.com",
      },
    ],
  },
  // Added rewrite proxy to fix CORS issues when accessing via local network IP
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        // destination: "https://staging.paybyapis.com/:path*",
        destination: "https://merchant.egpayment.com/:path*",
      }, 
    ];
  },
};
export default nextConfig;