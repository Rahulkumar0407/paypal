/**
 * The landing page moves across the shop as you scroll: each part of the story lies on the felt as its own object.
 * The till drawer (brushed metal) for the time-lapse, an accountant's green columnar pad for planning the fix, and
 * the banknote's engraved green for the Guard's receipts. Light scenes switch the text back to dark ink (`on-paper`).
 */
const KINDS = {
  drawer: "scene-drawer",
  ledger: "scene-ledger on-paper",
  counter: "scene-counter",
} as const;

export function Scene({ kind, children }: { kind: keyof typeof KINDS; children: React.ReactNode }) {
  return <div className={`scene ${KINDS[kind]}`}>{children}</div>;
}
