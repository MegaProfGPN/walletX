import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone hanya untuk membungkus Electron (desktop). Vercel pakai build sendiri.
  ...(process.env.DESKTOP_BUILD === "1" ? { output: "standalone" as const } : {}),
};

export default nextConfig;
