"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createRealMerchantStore, getVisitorStoreId, resetStoreWith } from "@/lib/demo";
import { getDb } from "@/lib/shared/db";

const wholeDollars = (label: string, max: number) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/[$,\s]/g, ""))
    .pipe(z.string().regex(/^\d+$/, `${label} needs to be a whole number of dollars, like 100.`))
    .transform(Number)
    .pipe(z.number().max(max, `${label} can be at most $${max.toLocaleString("en-US")}.`));

const onboardingSchema = z.object({
  name: z.string().trim().min(2, "Enter your store or business name.").max(50, "Keep name under 50 characters."),
  whatYouSell: z.string().trim().min(3, "Briefly describe what you sell or do.").max(200, "Keep under 200 characters."),
  openingBalanceDollars: wholeDollars("Starting cash balance", 10_000_000),
  minimumReserveDollars: wholeDollars("Minimum cash reserve", 1_000_000),
  timezone: z.string().trim().default("America/New_York"),
});

export interface OnboardingState {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Partial<Record<"name" | "whatYouSell" | "openingBalanceDollars" | "minimumReserveDollars" | "timezone", string>>;
}

export async function submitMerchantOnboarding(
  _prev: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const storeId = await getVisitorStoreId();
  const raw = {
    name: formData.get("name")?.toString() ?? "",
    whatYouSell: formData.get("whatYouSell")?.toString() ?? "",
    openingBalanceDollars: formData.get("openingBalanceDollars")?.toString() ?? "",
    minimumReserveDollars: formData.get("minimumReserveDollars")?.toString() ?? "",
    timezone: formData.get("timezone")?.toString() ?? "America/New_York",
  };

  const parsed = onboardingSchema.safeParse(raw);
  if (!parsed.success) {
    const errors: OnboardingState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<OnboardingState["errors"]>;
      errors[key] = issue.message;
    }
    return { status: "error", message: "Please check the highlighted fields.", errors };
  }

  const { name, whatYouSell, openingBalanceDollars, minimumReserveDollars, timezone } = parsed.data;

  try {
    await createRealMerchantStore(storeId, {
      name,
      whatYouSell,
      openingBalanceCents: openingBalanceDollars * 100,
      minimumBalanceCents: minimumReserveDollars * 100,
      tightMarginCents: Math.round(minimumReserveDollars * 50),
      timezone,
    });

    const paths = ["/today", "/dashboard", "/dues", "/approvals", "/settings", "/onboarding"];
    for (const p of paths) revalidatePath(p);

    return {
      status: "success",
      message: `Setup complete! ${name} is now connected with a $${minimumReserveDollars.toLocaleString()} reserve.`,
    };
  } catch (err) {
    console.error("[onboarding] failed to initialize merchant store:", err);
    return {
      status: "error",
      message: "Could not save merchant configuration. Please try again.",
    };
  }
}

export async function resetToDemoSimulation(): Promise<{ ok: boolean; message: string }> {
  const storeId = await getVisitorStoreId();
  try {
    await resetStoreWith(getDb(), storeId);
    const paths = ["/today", "/dashboard", "/dues", "/approvals", "/settings", "/onboarding", "/demo"];
    for (const p of paths) revalidatePath(p);
    return { ok: true, message: "Restored Loop Audio demonstration store." };
  } catch (err) {
    console.error("[onboarding] failed to restore demo:", err);
    return { ok: false, message: "Could not reset to demo store." };
  }
}
