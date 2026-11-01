// Prisma CLI configuration (migrations, studio, seed). Shared file: changes go through Person 2.
//
// Supabase has two connection strings:
//   DATABASE_URL  pooled (Transaction pooler, port 6543)  -> used by the app at runtime (lib/shared/db.ts)
//   DIRECT_URL    direct or Session pooler (port 5432)    -> used here, by the Prisma CLI, for migrations
// Prisma 7 does not load .env by itself, so dotenv is imported first.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
