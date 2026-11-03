import type { NextConfig } from "next";
const config: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" }
    ]
  },
  async redirects() { return ["/datas.html", "/index.html"].map(source => ({ source, destination: "/", permanent: true })); },
  async headers() { return [{ source: "/api/v1/:path*", headers: [
    { key: "Access-Control-Allow-Origin", value: "*" },
    { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
    { key: "X-Content-Type-Options", value: "nosniff" }
  ] }]; }
};
export default config;
