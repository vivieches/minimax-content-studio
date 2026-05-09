import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  compress: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.minimax.io" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "**.oss-us-east-1.aliyuncs.com" },
      { protocol: "http", hostname: "**.oss-us-east-1.aliyuncs.com" },
      { protocol: "https", hostname: "hailuo-image-algeng-data-us.oss-us-east-1.aliyuncs.com" },
      { protocol: "http", hostname: "hailuo-image-algeng-data-us.oss-us-east-1.aliyuncs.com" },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/(.*)\\.(js|css|woff2|woff|ttf|ico|png|jpg|svg|avif|webp)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
