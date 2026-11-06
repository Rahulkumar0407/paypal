import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/**
 * Hashes a plaintext password using Node's cryptographic scrypt with a random 16-byte salt.
 * Formatted as: `salt$hash` in hex.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH);
  return `${salt}$${derivedKey.toString("hex")}`;
}

/**
 * Verifies a password against a stored `salt$hash` using constant-time comparison to prevent timing attacks.
 */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, expectedHashHex] = stored.split("$");
    if (!salt || !expectedHashHex) return false;
    const derivedKey = scryptSync(password, salt, KEY_LENGTH);
    const expectedKey = Buffer.from(expectedHashHex, "hex");
    if (derivedKey.length !== expectedKey.length) return false;
    return timingSafeEqual(derivedKey, expectedKey);
  } catch {
    return false;
  }
}

/** Generates a high-entropy 256-bit random session token (64 hex characters). */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

/** Hashes a session token with SHA-256 for secure storage in the database. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

