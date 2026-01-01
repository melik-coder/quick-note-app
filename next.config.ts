import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // assetPrefix ChatGPT iframe için kritik - doğru URL'den asset yüklemesini sağlar
  assetPrefix: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : undefined,
};

export default nextConfig;
