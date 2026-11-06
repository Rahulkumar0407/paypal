import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getEnv } from "./env";
import { SUPABASE_CA_PEM } from "./supabase-ca";

/**
 * The single Prisma client for the app (server code only).
 * It connects through DATABASE_URL: Supabase's pooled connection (Transaction pooler, port 6543).
 * Migrations use DIRECT_URL instead (see prisma.config.ts).
 */

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not set. Add your Supabase connection strings to .env (see README).");
    this.name = "DatabaseNotConfiguredError";
  }
}

export function isDatabaseConfigured(): boolean {
  return Boolean(getEnv().DATABASE_URL);
}

function isLocalHost(connectionString: string): boolean {
  try {
    const host = new URL(connectionString).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export function createPrismaClient(connectionString: string): PrismaClient {
  const sslInUrl = /[?&]sslmode=/.test(connectionString);
  const adapter = new PrismaPg({
    connectionString,
    // Production Grade Strict TLS Verification:
    // Uses trusted Supabase Root & Intermediate CA bundle with rejectUnauthorized: true.
    ssl: sslInUrl || isLocalHost(connectionString)
      ? undefined
      : {
          rejectUnauthorized: true,
          ca: SUPABASE_CA_PEM,
        },
    // Ten connections: a page's forecast reads ~10 small queries at once, so they go in one wave, not two.
    max: 10,
    connectionTimeoutMillis: 8_000,
    // Keep connections open between visits: opening a new TLS connection to Supabase costs a second or two.
    idleTimeoutMillis: 5 * 60 * 1000,
    keepAlive: true,
  });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { nevershortPrisma?: PrismaClient };

/** The shared client. Throws DatabaseNotConfiguredError when DATABASE_URL is missing. */
export function getDb(): PrismaClient {
  const url = getEnv().DATABASE_URL;
  if (!url) throw new DatabaseNotConfiguredError();
  if (!globalForPrisma.nevershortPrisma) {
    globalForPrisma.nevershortPrisma = createPrismaClient(url);
  }
  return globalForPrisma.nevershortPrisma;
}
