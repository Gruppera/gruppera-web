import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Statisk export till ./out för hosting på Cloudflare Pages.
  // Inga route handlers, ingen server — allt prerenderas vid build.
  output: "export",
};

export default nextConfig;
