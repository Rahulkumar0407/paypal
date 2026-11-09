import { createHash, randomBytes } from "node:crypto";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import { hashPassword } from "./crypto";

const TOKEN_BYTES = 32;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function newRawToken(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export async function createEmailVerificationToken(userId: string): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  const db = getDb();
  // Invalidate previous unused tokens
  await db.emailVerificationToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
  const raw = newRawToken();
  await db.emailVerificationToken.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + VERIFY_TTL_MS) },
  });
  return raw;
}

export async function verifyEmailToken(rawToken: string): Promise<{ ok: boolean; message: string }> {
  if (!isDatabaseConfigured()) return { ok: false, message: "Database not configured." };
  const db = getDb();
  const record = await db.emailVerificationToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!record) return { ok: false, message: "Invalid or expired verification link." };
  if (record.usedAt) return { ok: false, message: "This verification link has already been used." };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, message: "This verification link has expired." };
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
    db.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  return { ok: true, message: "Email verified." };
}

export async function createPasswordResetToken(userId: string): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  const db = getDb();
  await db.passwordResetToken.updateMany({
    where: { userId, usedAt: null },
    data: { usedAt: new Date() },
  });
  const raw = newRawToken();
  await db.passwordResetToken.create({
    data: { userId, tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });
  return raw;
}

export async function resetPasswordWithToken(rawToken: string, newPassword: string): Promise<{ ok: boolean; message: string }> {
  if (!isDatabaseConfigured()) return { ok: false, message: "Database not configured." };
  if (newPassword.length < 8) return { ok: false, message: "Password must be at least 8 characters." };
  const db = getDb();
  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!record) return { ok: false, message: "Invalid or expired reset link." };
  if (record.usedAt) return { ok: false, message: "This reset link has already been used." };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, message: "This reset link has expired." };
  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: hashPassword(newPassword) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.session.updateMany({ where: { userId: record.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  return { ok: true, message: "Password updated." };
}

/**
 * Email delivery is intentionally abstracted. Without a configured provider, delivery is blocked and no token is logged.
 */
export function isEmailDeliveryConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_URL);
}

export async function sendVerificationEmail(): Promise<{ sent: boolean; reason?: string }> {
  if (!isEmailDeliveryConfigured()) {
    return { sent: false, reason: "Email delivery is not configured. Verification cannot be completed automatically." };
  }
  // Provider integration would go here. Left unimplemented to avoid leaking tokens.
  return { sent: false, reason: "Email provider integration not implemented." };
}