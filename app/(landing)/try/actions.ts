"use server";

import { z } from "zod";
import { yourForecast, type YourNumbers } from "@/lib/forecast";
import { judgeYourFix } from "@/lib/landing";
import { today } from "@/lib/shared/clock";
import { PAYMENT_ROWS, toTryView, type TryResult } from "./view";

/**
 * "Try it with your numbers": checks the answers and runs the app's own forecast on them. Nothing is stored and nothing
 * leaves this request: no database, no PayPal, no AI.
 */

const dollars = (label: string, { allowEmpty = false } = {}) =>
  z
    .string()
    .trim()
    .transform((v) => v.replace(/[$,\s]/g, ""))
    .pipe(
      allowEmpty
        ? z.string().regex(/^\d*$/, `${label}: whole dollars, like 250.`)
        : z.string().regex(/^\d+$/, `${label}: whole dollars, like 250.`),
    )
    .transform((v) => (v === "" ? 0 : Number(v)))
    .pipe(z.number().max(1_000_000, `${label} can be at most $1,000,000.`));

const KINDS = ["BILL", "SUPPLIER", "OWNER_TRANSFER"] as const;

const row = z.object({
  name: z.string().trim().max(40, "Keep the name under 40 characters."),
  amount: dollars("Amount", { allowEmpty: true }),
  day: z.coerce.number().int().min(0).max(13),
  kind: z.enum(KINDS),
  weekly: z.boolean(),
});

const schema = z.object({
  balance: dollars("Money in PayPal today"),
  sales: dollars("A normal day's sales"),
  minimum: dollars("Lowest balance"),
});

export async function runTry(previous: TryResult, form: FormData): Promise<TryResult> {
  const text = (key: string) => {
    const v = form.get(key);
    return typeof v === "string" ? v : "";
  };
  const values: Record<string, string> = { balance: text("balance"), sales: text("sales"), minimum: text("minimum") };
  for (let i = 0; i < PAYMENT_ROWS; i++) {
    for (const f of ["name", "amount", "day", "kind"]) values[`${f}${i}`] = text(`${f}${i}`);
    values[`weekly${i}`] = form.get(`weekly${i}`) ? "on" : "";
  }
  const attempt = previous.attempt + 1;
  const errors: Record<string, string> = {};

  const head = schema.safeParse(values);
  if (!head.success) for (const issue of head.error.issues) errors[String(issue.path[0])] ??= issue.message;

  const payments: YourNumbers["payments"] = [];
  for (let i = 0; i < PAYMENT_ROWS; i++) {
    if (!values[`name${i}`]!.trim() && !values[`amount${i}`]!.trim()) continue;
    const parsed = row.safeParse({ name: values[`name${i}`], amount: values[`amount${i}`], day: values[`day${i}`], kind: values[`kind${i}`], weekly: values[`weekly${i}`] === "on" });
    if (!parsed.success) {
      errors[`row${i}`] = parsed.error.issues[0]?.message ?? "Check this payment.";
      continue;
    }
    if (!parsed.data.name) {
      errors[`row${i}`] = "Give this payment a name, like Rent.";
      continue;
    }
    if (parsed.data.amount === 0) {
      errors[`row${i}`] = "Add how much it is.";
      continue;
    }
    payments.push({ name: parsed.data.name, kind: parsed.data.kind, amountCents: parsed.data.amount * 100, inDays: parsed.data.day, weekly: parsed.data.weekly });
  }

  if (!head.success || Object.keys(errors).length > 0) {
    return { status: "invalid", message: "A couple of answers need another look.", errors, values, attempt, view: previous.view };
  }
  const numbers: YourNumbers = {
    balanceCents: head.data.balance * 100,
    dailySalesCents: head.data.sales * 100,
    minimumBalanceCents: head.data.minimum * 100,
    payments,
  };
  // "Try this fix" submits the same answers plus the fix's id; it's worked out again here from the numbers, never trusted from the browser.
  const fixId = text("fix");
  const verdict = fixId ? judgeYourFix(numbers, fixId, today()) : null;
  const message = fixId && !verdict ? "That fix doesn't fit these numbers any more. Here are your two weeks as typed." : "";
  return { status: "ok", message, errors: {}, values, attempt, view: toTryView(yourForecast(numbers, today()), verdict) };
}
