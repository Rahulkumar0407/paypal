import type { Forecast } from "@/types";
import { explainShortfall } from "@/lib/ai";

/** One line under the headline on why the short day is short. The headline itself stays code-built. Server only. */
export async function ShortfallNote({ forecast }: { forecast: Forecast }) {
  const text = await explainShortfall(forecast).catch(() => null);
  return text ? <p className="max-w-[60ch] text-[16px] leading-7 text-white/85">{text}</p> : null;
}
