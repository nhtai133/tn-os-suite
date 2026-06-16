import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@tn-os/ui", "@tn-os/schemas", "@tn-os/sync"],
};

export default nextConfig;
