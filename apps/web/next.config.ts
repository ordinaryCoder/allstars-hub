import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@packages/database'],
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;