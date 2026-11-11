import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tailwind CSS v4 runs as a Turbopack loader (Next.js 16 default setup).
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Turbopack's dev disk cache kept serving an old globals.css after edits and restarts (the Tailwind loader's output
  // was reused), so `next dev` starts fresh each time. Builds keep their cache.
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
  // No "N" dev badge in the corner (it sat on top of the tmrw scenes).
  devIndicators: false,
  // The Prisma client uses node-postgres; keep both out of the bundle.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
