import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["app.erdavid.my.id"],
  experimental: {
    serverActions: {
      allowedOrigins: ["app.erdavid.my.id"],
    },
  },
};

export default nextConfig;
