import { z } from "zod";

/**
 * The only place the app reads process.env (AGENTS.md section 9).
 * Every key is optional at parse time so the app still renders without a database
 * or AI key; code that needs a key calls `requireEnv`.
 */
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  DIRECT_URL: z.string().min(1).optional(),
  DEMO_TODAY: isoDate.default("2026-11-05"),
  APP_URL: z.string().url().default("http://localhost:3000"),

  PAYPAL_CLIENT_ID: z.string().min(1).optional(),
  PAYPAL_CLIENT_SECRET: z.string().min(1).optional(),
  PAYPAL_WEBHOOK_ID: z.string().min(1).optional(),
  PAYPAL_API_BASE: z.string().url().default("https://api-m.sandbox.paypal.com"),
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: z.string().min(1).optional(),
  PAYPAL_FAKE: z.enum(["0", "1"]).optional(),

  /** Set by Next.js and Node. Fake PayPal mode is refused when this is "production". */
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),

  /** One model id, or several separated by commas (tried in that order when one is out of quota). */
  AI_MODEL: z.string().min(1).optional(),
  /** The app's own budget per key and model, kept under Google's free limits (aistudio.google.com/rate-limit). */
  AI_MAX_REQUESTS_PER_MINUTE: z.coerce.number().int().positive().default(8),
  AI_MAX_REQUESTS_PER_DAY: z.coerce.number().int().positive().default(200),
  /** One Gemini key, or several separated by commas: requests are shared between them. */
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
  OPENROUTER_API_KEY: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

/** Treat empty strings in .env as "not set". */
function cleaned(source: NodeJS.ProcessEnv): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined && value.trim() !== "") out[key] = value.trim();
  }
  return out;
}

export function getEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(cleaned(source));
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment variables: ${problems}`);
  }
  return parsed.data;
}

export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = getEnv()[key];
  if (value === undefined || value === null) {
    throw new Error(`${String(key)} is not set. Add it to .env (see .env.example).`);
  }
  return value as NonNullable<Env[K]>;
}
