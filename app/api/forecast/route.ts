import { NextResponse } from "next/server";
import { getVisitorStoreId } from "@/lib/demo";
import { buildHeadline, getForecast } from "@/lib/forecast";

/** Owner: Person 3. The visitor's 14-day forecast and headline (stub data until P3-1). */
export async function GET() {
  const storeId = await getVisitorStoreId();
  const forecast = await getForecast(storeId);
  return NextResponse.json({ forecast, headline: buildHeadline(forecast) });
}
