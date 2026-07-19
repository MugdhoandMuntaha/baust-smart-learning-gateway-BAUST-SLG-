import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ['172.31.0.1', '172.31.0.1:3000', 'localhost', 'localhost:3000'],
};

export default nextConfig;
