import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/contents/:slug.json",
        destination: "/api/contents/:slug",
      },
    ];
  },
};

export default nextConfig;
