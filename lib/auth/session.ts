import { cookies } from "next/headers";
import type { PrismaClient } from "@/generated/prisma/client";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import { generateSessionToken, hashSessionToken } from "./crypto";

export const SESSION_COOKIE = "ns_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  stores: {
    storeId: string;
    role: "OWNER" | "MANAGER" | "VIEWER";
    storeName: string;
  }[];
}

/**
 * Creates a database session record and sets an HTTP-only, secure, sameSite="lax" cookie.
 */
export async function createSession(
  userId: string,
  meta?: { ipAddress?: string; userAgent?: string },
  dbOverride?: PrismaClient
): Promise<string> {
  const db = dbOverride ?? getDb();
  const rawToken = generateSessionToken();
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return rawToken;
}

/**
 * Validates a session token string against the database.
 * Returns the user and store memberships if valid and active.
 */
export async function validateSessionToken(
  token: string,
  dbOverride?: PrismaClient
): Promise<AuthenticatedUser | null> {
  if (!dbOverride && !isDatabaseConfigured()) return null;
  const db = dbOverride ?? getDb();
  const tokenHash = hashSessionToken(token);

  const session = await db.session.findUnique({
    where: { tokenHash },
    include: {
      user: {
        include: {
          memberships: {
            include: {
              store: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!session) return null;
  if (session.revokedAt !== null) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    emailVerified: session.user.emailVerified,
    stores: session.user.memberships.map((m) => ({
      storeId: m.storeId,
      role: m.role,
      storeName: m.store.name,
    })),
  };
}

/**
 * Reads the session cookie and returns the authenticated user, or null if unauthenticated.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    return await validateSessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Revokes the active session in the database and clears the session cookie.
 */
export async function revokeCurrentSession(): Promise<void> {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    if (token && isDatabaseConfigured()) {
      const tokenHash = hashSessionToken(token);
      await getDb().session.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    jar.delete(SESSION_COOKIE);
  } catch (err) {
    console.error("[auth] failed to revoke session:", err);
  }
}
