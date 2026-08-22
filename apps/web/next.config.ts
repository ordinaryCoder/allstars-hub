import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: false,
});

const nextConfig: NextConfig = {
  transpilePackages: ['@packages/database'],
  serverExternalPackages: ["@prisma/client"],
  turbopack: {},
};

export default withSerwist(nextConfig);

