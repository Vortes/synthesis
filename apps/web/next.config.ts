import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@curate/ui", "@curate/api", "@curate/db"],
};

export default nextConfig;
