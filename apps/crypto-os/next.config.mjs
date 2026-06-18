/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@tn-os/ui", "@tn-os/schemas", "@tn-os/sync", "@tn-os/market-data"],
};
export default nextConfig;
