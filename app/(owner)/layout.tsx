import { after } from "next/server";
import { AppShell } from "@/components/app/AppShell";
import { agentsHaveRun, runAgents } from "./agents";
import { ensureStore, getVisitorStoreId } from "@/lib/demo";
import { getStoreSettings } from "@/lib/store";
import { today } from "@/lib/shared/clock";

/** Every owner page: makes sure this visitor's store exists, reads real settings, then draws the shell. */
export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const storeId = await getVisitorStoreId();
  let storeName = "Loop Audio";
  let isDemo = true;

  try {
    const copy = await ensureStore(storeId);
    const settings = await getStoreSettings(storeId);
    storeName = settings.name;
    isDemo = settings.name === "Loop Audio";

    // Once the page is sent, let the reminder helper and the risk check do their round, so Approvals is ready.
    if (copy !== null && !agentsHaveRun(storeId)) after(() => runAgents(storeId));
  } catch (error) {
    // The pages still render from the module stubs; /demo and /api/health show the database problem.
    console.error(`[demo] could not prepare store ${storeId}:`, error instanceof Error ? error.message : error);
  }

  return (
    <AppShell today={today()} storeName={storeName} isDemo={isDemo}>
      {children}
    </AppShell>
  );
}
