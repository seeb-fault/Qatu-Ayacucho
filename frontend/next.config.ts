import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  experimental: { proxyClientMaxBodySize: 12 * 1024 * 1024 },
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${process.env.QATU_API_URL ?? 'http://127.0.0.1:3001'}/api/v1/:path*` }];
  },
};
export default config;
