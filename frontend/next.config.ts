import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@cloudscape-design/components",
    "@cloudscape-design/component-toolkit",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://13.202.111.91:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
