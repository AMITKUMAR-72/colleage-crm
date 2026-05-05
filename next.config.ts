import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    // Ignore type errors during production builds
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: "http://localhost:8085/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        // Add CORS headers for all routes in case it's needed for assets or internal APIs
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ]
  }
};

export default nextConfig;
