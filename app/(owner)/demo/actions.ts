"use server";

import { revalidatePath } from "next/cache";
import { getVisitorStoreId, resetStore } from "@/lib/demo";
import { isDatabaseConfigured } from "@/lib/shared/db";

export type ResetResult = { status: "idle" } | { status: "done"; runId: string } | { status: "failed"; message: string };

/** Puts this visitor's copy of Loop Audio back at the start of the story (Person 3's resetStore). Other visitors are untouched. */
export async function resetMyCopy(previous: ResetResult): Promise<ResetResult> {
  void previous;
  if (!isDatabaseConfigured()) {
    return { status: "failed", message: "No database is connected, so there's nothing to reset: the pages show sample data." };
  }
  const storeId = await getVisitorStoreId();
  try {
    const runId = await resetStore(storeId);
    revalidatePath("/", "layout");
    return { status: "done", runId };
  } catch (error) {
    console.error(`[demo] reset failed for ${storeId}:`, error instanceof Error ? error.message : error);
    return { status: "failed", message: "The reset didn't finish, and nothing was half-changed: it runs all at once or not at all. Try again in a minute." };
  }
}
