import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isProd ? "/CLI/training-center" : "",
  assetPrefix: isProd ? "/CLI/training-center/" : "",
};

export default nextConfig;
