"use server";

import { z } from "zod";
import { ensureStore, getVisitorStoreId } from "@/lib/demo";
import { today } from "@/lib/shared/clock";
import { saveSetupAnswers } from "@/lib/store";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** "$1,200" or "1200" → 120000 cents; anything else → null. */
function centsFrom(text: string): number | null {
  const m = text.replace(/[,\s]/g, "").match(/\$?(\d+(?:\.\d{1,2})?)/);
  return m ? Math.round(Number(m[1]) * 100) : null;
}

/** "Sun 6 Dec", "6 Dec", "Dec 6", "December" → the next such date from today ('YYYY-MM-DD'); otherwise null. */
function dateFrom(text: string, from: string): string | null {
  const t = text.toLowerCase();
  const month = MONTHS.findIndex((m) => t.includes(m));
  if (month < 0) return null;
  const day = Number(t.match(/\b(\d{1,2})\b/)?.[1] ?? 1);
  if (day < 1 || day > 31) return null;
  const year = Number(from.slice(0, 4));
  const candidate = (y: number) => `${y}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return candidate(year) >= from ? candidate(year) : candidate(year + 1);
}

const text = (max: number) => z.string().trim().max(max);
const schema = z.object({
  name: z.string().trim().min(1).max(80),
  type: text(60),
  cushionDollars: z.number().int().min(0).max(100_000),
  seasons: z.array(z.string().trim().min(1).max(60)).max(12),
  busyDays: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])).max(7),
  movable: z.record(z.string().max(80), z.boolean()),
  outside: z.array(z.object({ name: z.string().trim().min(1).max(80), detail: text(120), kind: z.enum(["Expense", "Revenue"]) })).max(30),
  clients: z.array(z.object({ name: z.string().trim().min(1).max(80), note: text(80), reminders: z.boolean(), tone: z.enum(["Gentle", "Firm"]) })).max(30),
  plans: z.array(z.object({ plan: z.string().trim().min(1).max(80), cost: text(40), by: text(40) })).max(12),
  team: z.array(z.object({ name: z.string().trim().min(1).max(60), role: text(60), phone: text(30) })).max(30),
  briefTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  briefChannels: z.array(z.enum(["In the app", "Notification", "WhatsApp", "Email"])).min(1).max(4),
});

export type SetupPayload = z.input<typeof schema>;

/** "Start my day": keep the setup answers on this visitor's shop. Returns false when nothing could be saved. */
export async function saveSetup(payload: SetupPayload): Promise<{ ok: boolean }> {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return { ok: false };
  const a = parsed.data;
  const storeId = await getVisitorStoreId();
  await ensureStore(storeId);
  const day = today();
  const plans = a.plans.map((p) => ({ title: p.plan, amountCents: centsFrom(p.cost) ?? 0, wantedOn: dateFrom(p.by, day) }));
  const ok = await saveSetupAnswers(storeId, {
    name: a.name,
    businessType: a.type,
    busyDays: a.busyDays,
    // "Bean There - coffee beans" is the payee "Bean There".
    movable: Object.fromEntries(Object.entries(a.movable).map(([name, v]) => [name.split(" - ")[0]!, v])),
    outside: a.outside.map((o) => ({ name: o.name, detail: o.detail, kind: o.kind === "Revenue" ? "REVENUE" : "EXPENSE", amountCents: centsFrom(o.detail) })),
    clients: a.clients,
    team: a.team,
    briefTime: a.briefTime,
    briefChannels: a.briefChannels,
    whatYouSell: a.type ? `${a.type}, ordered through PayPal.` : "A small shop, ordered through PayPal.",
    minimumBalanceCents: a.cushionDollars * 100,
    busySeasons: a.seasons,
    plans: plans.filter((p) => p.amountCents > 0),
  });
  return { ok };
}
