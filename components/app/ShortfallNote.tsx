import type { Forecast } from "@/types";
import { explainShortfall } from "@/lib/ai";

/** One line under the headline on why the short day is short. The headline itself stays code-built. Server only. */
export async function ShortfallNote({ forecast, className }: { forecast: Forecast; className?: string }) {
  const text = await explainShortfall(forecast).catch(() => null);
  return text ? (
    <p className={className ?? "max-w-[60ch] text-[15px] leading-relaxed text-slate-600"}>
      {text}
    </p>
  ) : null;
}
