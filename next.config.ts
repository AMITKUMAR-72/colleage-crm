import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://apis.rafunirp.com/api/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'http://apis.rafunirp.com/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
