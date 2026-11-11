import { NextResponse } from "next/server";
import { getVisitorStoreId } from "@/lib/demo";
import { buildHeadline, getForecast } from "@/lib/forecast";

/** The visitor's 30-day forecast and headline, worked out from their own copy of the store. */
export async function GET() {
  const storeId = await getVisitorStoreId();
  const forecast = await getForecast(storeId);
  return NextResponse.json({ forecast, headline: buildHeadline(forecast) });
}
