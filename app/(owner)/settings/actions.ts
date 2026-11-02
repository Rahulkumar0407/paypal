"use server";

import { z } from "zod";

export interface SettingsResult {
  status: "idle" | "checked" | "invalid";
  message: string;
  errors: Partial<Record<"minimum" | "margin" | "whatYouSell" | "supplierPaymentMethod" | "busySeasons", string>>;
  /** What was typed, so the form shows it again after React resets it. Counts submissions to re-mount the form. */
  values: Record<string, string> | null;
  attempt: number;
}

const wholeDollars = (label: string, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/[$,\s]/g, ""))
    .pipe(z.string().regex(/^\d+$/, `${label} needs to be a whole number of dollars, like 100.`))
    .transform(Number)
    .pipe(z.number().max(max, `${label} can be at most $${max.toLocaleString("en-US")}.`));

const schema = z.object({
  minimum: wholeDollars("Your lowest balance", 100_000),
  margin: wholeDollars("The warning zone", 100_000),
  whatYouSell: z.string().trim().min(3, "Say in a few words what you sell.").max(200, "Keep it under 200 characters."),
  supplierPaymentMethod: z.enum(["PAYPAL_PAYOUTS", "BANK_TRANSFER", "CARD"], { error: "Pick how you pay suppliers." }),
  busySeasons: z
    .string()
    .transform((v) => v.split("\n").map((line) => line.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(60, "Keep each season under 60 characters.")).max(6, "Up to six busy seasons.")),
});

/**
 * Checks the setup answers. TODO(Person 2 / Person 4, P4-4): lib/store has no save function yet, so the answers are
 * checked but not kept. Once `saveStoreSettings` exists, call it here with the parsed values (minimum and margin in cents).
 */
export async function checkSettings(previous: SettingsResult, form: FormData): Promise<SettingsResult> {
  const text = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" ? v : "";
  };
  const values = {
    minimum: text("minimum"),
    margin: text("margin"),
    whatYouSell: text("whatYouSell"),
    supplierPaymentMethod: text("supplierPaymentMethod"),
    busySeasons: text("busySeasons"),
  };
  const attempt = previous.attempt + 1;
  const parsed = schema.safeParse(values);
  if (!parsed.success) {
    const errors: SettingsResult["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof SettingsResult["errors"];
      errors[key] ??= issue.message;
    }
    return { status: "invalid", message: "A couple of answers need another look.", errors, values, attempt };
  }
  return {
    status: "checked",
    message: "These look right. The demo doesn't keep changes yet, so the forecast still uses the store's own answers.",
    errors: {},
    values,
    attempt,
  };
}
