"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { DEMO_STORE_SETTINGS, getVisitorStoreId } from "@/lib/demo";
import { getForecast } from "@/lib/forecast";
import { saveStoreSettings } from "@/lib/store";
import { formatDay } from "@/lib/shared/dates";
import { formatDollars, formatShortfall } from "@/lib/shared/money";

export interface SettingsResult {
  status: "idle" | "saved" | "invalid";
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

/** Every screen that colours days or judges money against the minimum. */
const AFFECTED = ["/today", "/dues", "/fix", "/approvals", "/ask", "/dashboard", "/settings"];

/**
 * Checks the setup answers and keeps them on this visitor's copy of the store. The reply says what the new safety line
 * does to the next 14 days, worked out by the forecast (never by AI).
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
  const answers = parsed.data;
  const storeId = await getVisitorStoreId();
  try {
    const kept = await saveStoreSettings(storeId, {
      minimumBalanceCents: answers.minimum * 100,
      tightMarginCents: answers.margin * 100,
      whatYouSell: answers.whatYouSell,
      supplierPaymentMethod: answers.supplierPaymentMethod,
      busySeasons: answers.busySeasons,
    });
    if (!kept) {
      return { status: "invalid", message: "These look right, but this copy has no database to keep them in.", errors: {}, values, attempt };
    }
  } catch (error) {
    console.error("[settings] could not save:", error instanceof Error ? error.message : error);
    return { status: "invalid", message: "Couldn't save just now. Nothing has changed. Try again in a minute.", errors: {}, values, attempt };
  }
  for (const path of AFFECTED) revalidatePath(path);

  // What the new line means for the next two weeks.
  const forecast = await getForecast(storeId).catch(() => null);
  const gap = forecast?.firstShortfall ?? null;
  const effect = !forecast
    ? ""
    : gap
      ? ` With a ${formatDollars(answers.minimum * 100)} minimum, the first short day is ${formatDay(gap.date)}, ${formatShortfall(gap.amountCents)} short.`
      : ` With a ${formatDollars(answers.minimum * 100)} minimum, no day in the next 14 is short.`;
  const story =
    answers.minimum * 100 !== DEMO_STORE_SETTINGS.minimumBalanceCents || answers.margin * 100 !== DEMO_STORE_SETTINGS.tightMarginCents
      ? " The demo story's numbers assume $100 and $50; Reset on the demo guide puts them back."
      : "";
  return { status: "saved", message: `Saved.${effect}${story}`, errors: {}, values, attempt };
}
