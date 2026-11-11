import type { Metadata } from "next";
import { TopBar } from "@/components/landing/TopBar";
import { TryIt } from "@/components/landing/TryIt";
import { yourForecast } from "@/lib/forecast";
import { today } from "@/lib/shared/clock";
import { runTry } from "./actions";
import { EXAMPLE, PAYMENT_ROWS, dayOptions, exampleValues, toTryView, type TryResult } from "./view";

export const metadata: Metadata = {
  title: { absolute: "Find your short day · tmrw" },
  description: "Type a few numbers about your shop and see your next 30 days, worked out by tmrw's own forecast. Nothing is saved.",
};

/**
 * /try: the landing page's "now your shop". A few numbers in, the app's own forecast out. It opens with example numbers
 * already worked out, so the result shows before anyone types. No database, no login, nothing saved.
 */
export default function TryPage() {
  const day = today();
  const initial: TryResult = {
    status: "idle",
    message: "",
    errors: {},
    values: exampleValues(PAYMENT_ROWS),
    attempt: 0,
    view: toTryView(yourForecast(EXAMPLE, day)),
  };
  return (
    <>
      <TopBar />
      <main id="main" className="mx-auto w-full max-w-[1240px] px-5 pt-10 pb-20 lg:px-10 lg:pt-14 lg:pb-28">
        <div className="max-w-[760px]">
          <p className="pill">Your shop</p>
          <h1 className="display mt-5 text-[2.8rem] leading-[0.96] text-ink lg:text-[4.2rem]">Find your short day.</h1>
          <p className="mt-5 max-w-[56ch] text-[18px] leading-8 text-ink">
            A few numbers about your shop, and tmrw works out your next 30 days with the same forecast it runs for
            every shop: day by day, the short one stamped, and ways to fix it. No sign-up. Nothing is saved.
          </p>
        </div>
        <div className="mt-10">
          <TryIt action={runTry} initial={initial} days={dayOptions(day)} />
        </div>
      </main>
    </>
  );
}
