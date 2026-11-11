import type { Metadata } from "next";
import { ErrorState } from "@/components/ui";
import { getVisitorStoreId } from "@/lib/demo";
import { listInbox } from "@/lib/guard";
import { listOutbox } from "@/lib/recovery";
import { after } from "next/server";
import { agentsHaveRun, runAgents } from "../agents";
import { decideEscalation, sendFollowUp } from "./actions";
import { DecisionsViews } from "@/components/app/DecisionsViews";

export const metadata: Metadata = { title: "Decisions • tmrw" };

export default async function ApprovalsPage() {
  const storeId = await getVisitorStoreId();

  if (agentsHaveRun(storeId)) after(() => runAgents(storeId));
  else await runAgents(storeId);

  const loaded = await Promise.all([listInbox(storeId), listOutbox(storeId)]).catch((error: unknown) => {
    console.error("[approvals] could not load inbox:", error instanceof Error ? error.message : error);
    return null;
  });

  if (!loaded) {
    return (
      <div className="space-y-6 max-w-xl mx-auto">
        <ErrorState
          title="Couldn't load your decisions inbox."
          body="Nothing requiring your sign-off has proceeded. Try again in a minute."
          retryHref="/approvals"
        />
      </div>
    );
  }

  const [inbox, outbox] = loaded;
  const waiting = inbox.filter((i) => i.status === "WAITING");
  const decided = inbox.filter((i) => i.status !== "WAITING");

  return (
    <div className="space-y-6 max-w-[960px] mx-auto">
      {/* ── Page Header ── */}
      <div className="space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 tracking-tight">
          Decisions & Approvals
        </h1>
        <p className="text-sm text-slate-500">
          Small, safe actions proceed automatically. Larger payments, gap loans, and held orders wait here for your sign-off.
        </p>
      </div>

      {/* ── Three Segmented Views (Needs approval | History | Sent reminders) ── */}
      <DecisionsViews
        waiting={waiting}
        decided={decided}
        outbox={outbox}
        decide={decideEscalation}
        sendFollowUp={sendFollowUp}
      />
    </div>
  );
}
