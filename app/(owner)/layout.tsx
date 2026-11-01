import { AppShell } from "@/components/app/AppShell";
import { ensureStore, getVisitorStoreId } from "@/lib/demo";
import { today } from "@/lib/shared/clock";

/** Every owner page: makes sure this visitor's own copy of Loop Audio exists, then draws the shell. */
export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const storeId = await getVisitorStoreId();
  try {
    await ensureStore(storeId);
  } catch (error) {
    // The pages still render from the module stubs; /demo and /api/health show the database problem.
    console.error(`[demo] could not prepare store ${storeId}:`, error instanceof Error ? error.message : error);
  }
  return (
    <AppShell today={today()} storeName="Loop Audio">
      {children}
    </AppShell>
  );
}
