"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb, isDatabaseConfigured } from "@/lib/shared/db";
import { hashPassword, verifyPassword } from "./crypto";
import { createSession, revokeCurrentSession } from "./session";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

export interface AuthActionResult {
  status: "idle" | "error";
  message: string;
  errors?: Partial<Record<"name" | "email" | "password" | "storeName", string>>;
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(60, "Keep name under 60 characters."),
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters."),
  storeName: z.string().trim().min(2, "Enter your store or company name.").max(60, "Keep store name under 60 characters."),
});

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  password: z.string().min(1, "Password is required."),
});

function newStoreId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "st_";
  for (let i = 0; i < 12; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

export async function registerAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  if (!isDatabaseConfigured()) {
    return { status: "error", message: "Database is not configured." };
  }

  // Rate limit: max 5 registrations per 15 minutes per IP
  const reqHeaders = await headers().catch(() => null);
  const clientIp = reqHeaders?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimit = checkRateLimit(`register:${clientIp}`, 5, 15 * 60 * 1000);
  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: `Too many registration attempts. Please try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minutes.`,
    };
  }

  const raw = {
    name: formData.get("name")?.toString() ?? "",
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
    storeName: formData.get("storeName")?.toString() ?? "",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: AuthActionResult["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<AuthActionResult["errors"]>;
      errors[key] = issue.message;
    }
    return { status: "error", message: "Please resolve the highlighted issues.", errors };
  }

  const { name, email, password, storeName } = parsed.data;
  const db = getDb();

  // Check existing user
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      status: "error",
      message: "An account with this email address already exists. Please sign in.",
      errors: { email: "Email already registered." },
    };
  }

  const passwordHash = hashPassword(password);
  const storeId = newStoreId();
  const demoRunId = `run_${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;

  try {
    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          emailVerified: true, // auto-verified for onboarding
        },
      });

      const newStore = await tx.store.create({
        data: {
          id: storeId,
          name: storeName,
          currency: "USD",
          timezone: "America/New_York",
          minimumBalanceCents: 25_000, // $250 default minimum reserve
          tightMarginCents: 12_500, // $125 default warning margin
          openingBalanceCents: 150_000, // $1,500 initial cash balance
          openingBalanceOn: new Date().toISOString().slice(0, 10),
          whatYouSell: "General Goods & Services",
          supplierPaymentMethod: "PAYPAL_PAYOUTS",
          busySeasons: [],
          demoRunId,
          isDemo: false,
        },
      });

      await tx.userStore.create({
        data: {
          userId: newUser.id,
          storeId: newStore.id,
          role: "OWNER",
        },
      });

      return newUser;
    });

    await createSession(user.id);
  } catch (err) {
    console.error("[auth] registration failed:", err);
    return { status: "error", message: "Could not create account. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/today");
}

export async function loginAction(
  _prev: AuthActionResult,
  formData: FormData
): Promise<AuthActionResult> {
  if (!isDatabaseConfigured()) {
    return { status: "error", message: "Database is not configured." };
  }

  const raw = {
    email: formData.get("email")?.toString() ?? "",
    password: formData.get("password")?.toString() ?? "",
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: AuthActionResult["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<AuthActionResult["errors"]>;
      errors[key] = issue.message;
    }
    return { status: "error", message: "Please check your email and password.", errors };
  }

  const { email, password } = parsed.data;

  // Rate limit: max 5 login attempts per 15 minutes per email and IP
  const reqHeaders = await headers().catch(() => null);
  const clientIp = reqHeaders?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimitEmail = checkRateLimit(`login:email:${email}`, 5, 15 * 60 * 1000);
  const rateLimitIp = checkRateLimit(`login:ip:${clientIp}`, 10, 15 * 60 * 1000);

  if (!rateLimitEmail.allowed || !rateLimitIp.allowed) {
    const retrySec = Math.max(rateLimitEmail.retryAfterSeconds, rateLimitIp.retryAfterSeconds);
    return {
      status: "error",
      message: `Too many login attempts. Please try again in ${Math.ceil(retrySec / 60)} minutes.`,
    };
  }

  const db = getDb();

  const user = await db.user.findUnique({
    where: { email },
    include: { memberships: { take: 1 } },
  });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return {
      status: "error",
      message: "Invalid email or password. Please try again.",
    };
  }

  // Reset rate limits upon successful credential verification
  resetRateLimit(`login:email:${email}`);

  try {
    await createSession(user.id);
  } catch (err) {
    console.error("[auth] login session creation failed:", err);
    return { status: "error", message: "Login failed. Please try again." };
  }

  revalidatePath("/", "layout");
  redirect("/today");
}

export async function logoutAction(): Promise<void> {
  await revokeCurrentSession();
  revalidatePath("/", "layout");
  redirect("/login");
}

