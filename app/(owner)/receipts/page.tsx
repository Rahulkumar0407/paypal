import type { Metadata } from "next";
import { EmptyState, PageSentence, Receipt, RefereeCard } from "@/components/ui";
import { getVisitorStoreId } from "@/lib/demo";
import { listReceipts } from "@/lib/guard";

export const metadata: Metadata = { title: "Receipts" };

export default async function ReceiptsPage() {
  const storeId = await getVisitorStoreId();
  const receipts = await listReceipts(storeId);
  const count = (d: "APPROVE" | "ESCALATE" | "BLOCK") => receipts.filter((r) => r.decision.decision === d).length;

  return (
    <div className="space-y-10">
      <div className="space-y-5">
        <PageSentence>Every decision the Guard made, with the rules it checked and why.</PageSentence>
        {receipts.length > 0 ? (
          <p className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
            <RefereeCard decision="APPROVE" label={`${count("APPROVE")} approved`} />
            <RefereeCard decision="ESCALATE" label={`${count("ESCALATE")} escalated`} />
            <RefereeCard decision="BLOCK" label={`${count("BLOCK")} blocked`} />
          </p>
        ) : null}
      </div>

      {receipts.length > 0 ? (
        <ol className="grid justify-items-center gap-10 rounded-card bg-brand px-4 py-10 sm:px-8 md:grid-cols-2 2xl:grid-cols-3">
          {receipts.map((r) => (
            <li key={r.id} id={r.id} className="flex w-full scroll-mt-24 justify-center">
              <Receipt receipt={r} />
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState title="No receipts yet." body="The first one prints when an agent proposes something or you pick a fix." />
      )}
    </div>
  );
}
