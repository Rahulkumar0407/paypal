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
  // The Prisma client uses node-postgres; keep both out of the bundle.
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
};

export default nextConfig;
