import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Allow larger request bodies for file uploads (default is 10MB)
    proxyClientMaxBodySize: "60mb",
  },
};

export default nextConfig;
