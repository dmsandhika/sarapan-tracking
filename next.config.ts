import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["app.erdavid.my.id"],
  serverExternalPackages: ["tesseract.js"],
  experimental: {
    serverActions: {
      allowedOrigins: ["app.erdavid.my.id"],
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
