import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API and Auth proxying is handled by server-side Route Handlers:
  //   src/app/api/[...path]/route.ts  → http://apis.rafunirp.com/api/*
  //   src/app/auth/[...path]/route.ts → http://apis.rafunirp.com/auth/*
  //
  // This gives us full control over which headers are forwarded,
  // preventing browser-generated headers from causing 500s on the backend.
};

export default nextConfig;
