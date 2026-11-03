"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getVisitorStoreId } from "@/lib/demo";
import { confirmRecurringPayee, dismissRecurringPayee } from "@/lib/forecast";

export type RegularPaymentAnswer = { ok: true } | { ok: false; message: string };

const schema = z.object({ payeeId: z.string().min(1).max(100), answer: z.enum(["confirm", "dismiss"]) });

/**
 * The owner answers "We think Volta is paid about $300 every 10 days". Confirming saves its next payments as dues;
 * "Not regular" takes it out of the forecast. Neither moves money, so neither goes through the Guard.
 */
export async function answerRegularPayment(payeeId: string, answer: "confirm" | "dismiss"): Promise<RegularPaymentAnswer> {
  const parsed = schema.safeParse({ payeeId, answer });
  if (!parsed.success) return { ok: false, message: "That answer wasn't recognised. Reload the page and try again." };
  const storeId = await getVisitorStoreId();
  try {
    if (parsed.data.answer === "confirm") await confirmRecurringPayee(storeId, parsed.data.payeeId);
    else await dismissRecurringPayee(storeId, parsed.data.payeeId);
  } catch (error) {
    console.error("[dues] could not save the answer:", error instanceof Error ? error.message : error);
    return { ok: false, message: "Couldn't save your answer. Nothing has changed. Try again in a minute." };
  }
  for (const path of ["/", "/dues", "/fix", "/dashboard"]) revalidatePath(path);
  return { ok: true };
}
