"use client";

import { useRef, useState, type ReactNode } from "react";
import { saveSetup } from "@/app/(tmrw)/actions";
import { SETUP_STEPS } from "./useStage";

// ---------------------------------------------------------------------------
// Small controls (all controlled: the answers live in Setup, so Back keeps them)
// ---------------------------------------------------------------------------

function Chips({ options, selected, onToggle, label }: { options: string[]; selected: string[]; onToggle: (o: string) => void; label: string }) {
  return (
    <div role="group" aria-label={label} style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
      {options.map((o) => (
        <button key={o} className="tmrw-chip" aria-pressed={selected.includes(o)} onClick={() => onToggle(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Segmented({ options, value, onChange, label }: { options: string[]; value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="tmrw-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} aria-pressed={value === o} onClick={() => onChange(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (on: boolean) => void }) {
  return <button className="tmrw-switch" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

const Label = ({ children }: { children: ReactNode }) => (
  <p className="tmrw-muted" style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>
    {children}
  </p>
);
const Title = ({ children, sub }: { children: ReactNode; sub: ReactNode }) => (
  <>
    <h2 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 700 }}>{children}</h2>
    <p className="tmrw-muted" style={{ margin: "0 0 20px", fontSize: 15 }}>
      {sub}
    </p>
  </>
);

const INPUT = { height: 40, padding: "0 12px", border: 0, borderRadius: 10, background: "rgba(0,0,0,.05)", font: "inherit", fontSize: 15, color: "#1D1D1F", minWidth: 0 } as const;

/** "+ Add …": opens a one-line form; Add puts the row in the list. */
function AddRow({ label, fields, onAdd }: { label: string; fields: { name: string; placeholder: string; width?: number }[]; onAdd: (values: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<string[]>(fields.map(() => ""));
  if (!open) {
    return (
      <button className="tmrw-chip" style={{ marginTop: 12 }} onClick={() => setOpen(true)}>
        + {label}
      </button>
    );
  }
  const ready = values[0]!.trim().length > 0;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        onAdd(values.map((v) => v.trim()));
        setValues(fields.map(() => ""));
        setOpen(false);
      }}
      style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", width: "100%" }}
    >
      {fields.map((f, i) => (
        <input
          key={f.name}
          aria-label={f.name}
          placeholder={f.placeholder}
          autoFocus={i === 0}
          value={values[i]}
          onChange={(e) => setValues((v) => v.map((x, j) => (j === i ? e.target.value : x)))}
          style={{ ...INPUT, flex: f.width ? `0 0 ${f.width}px` : 1 }}
        />
      ))}
      <button type="submit" className="tmrw-btn tmrw-pill tmrw-blue" style={{ height: 40, opacity: ready ? 1 : 0.5 }} disabled={!ready}>
        Add
      </button>
      <button type="button" className="tmrw-btn tmrw-pill tmrw-ghost" style={{ height: 40 }} onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  );
}

const RemoveButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button className="tmrw-btn" aria-label={label} title={label} onClick={onClick} style={{ flex: "0 0 28px", width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,.05)", color: "#6E6E73", display: "grid", placeItems: "center" }}>
    <svg className="tmrw-icon" width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  </button>
);

// ---------------------------------------------------------------------------
// The answers, starting from the demo shop's (simulated) PayPal history
// ---------------------------------------------------------------------------

type Kind = "Expense" | "Revenue";
interface Answers {
  name: string;
  type: string;
  busyDays: string[];
  seasons: string[];
  seasonOptions: string[];
  movable: Record<string, boolean>;
  outside: { name: string; detail: string; kind: Kind }[];
  uploads: string[];
  clients: { name: string; note: string; reminders: boolean; tone: string }[];
  cushion: number;
  plans: { plan: string; cost: string; by: string }[];
  team: { name: string; role: string; phone: string }[];
  briefTime: string;
  channels: string[];
}

const EXPENSES = [
  { name: "Rent", amt: "$1,500", when: "12th, monthly", how: "Bank transfer" },
  { name: "Bean There - coffee beans", amt: "$400", when: "Every 10 days", how: "PayPal" },
  { name: "Internet", amt: "$60", when: "3rd, monthly", how: "Auto-debit" },
  { name: "Card machine", amt: "$49", when: "13th, monthly", how: "Auto-debit" },
  { name: "Oven loan", amt: "$250", when: "25th, monthly", how: "Auto-debit" },
  { name: "Staff pay", amt: "$1,600", when: "28th, monthly", how: "PayPal" },
];
const REVENUE = [
  { name: "Daily sales", amt: "$180-$320", when: "Every day", how: "PayPal", note: "More on weekends" },
  { name: "Ivory & Vow - wedding cake", amt: "$240", when: "Due 18 Nov", how: "Invoice", note: "Usually 5 days late" },
];
const COLOURS = ["#AF52DE", "#FF9500", "#34C759", "#0071E3", "#FF2D55", "#5856D6"];

const START: Answers = {
  name: "Dunder Mifflin & Co.",
  type: "Bakery and café",
  busyDays: ["Sat", "Sun"],
  seasons: ["Christmas", "Weddings"],
  seasonOptions: ["Christmas", "Weddings", "Diwali", "Summer"],
  movable: { "Bean There - coffee beans": true },
  outside: [
    { name: "Oat of Office - oat milk", detail: "$180 - bank auto-debit on the 15th", kind: "Expense" },
    { name: "Weekend market - cash sales", detail: "about $150 - every Saturday", kind: "Revenue" },
  ],
  uploads: [],
  clients: [{ name: "Ivory & Vow - wedding planner", note: "usually pays 5 days late", reminders: true, tone: "Gentle" }],
  cushion: 200,
  plans: [
    { plan: "Second oven", cost: "$1,200", by: "Sat 21 Nov" },
    { plan: "Stall at the Winter Makers' Market", cost: "$300", by: "Sun 6 Dec" },
    { plan: "Launch Christmas cookie boxes", cost: "$450", by: "Sat 12 Dec" },
  ],
  team: [
    { name: "Flo", role: "Head baker", phone: "" },
    { name: "Marco", role: "Barista", phone: "" },
    { name: "Pam", role: "Front counter", phone: "" },
  ],
  briefTime: "08:00",
  channels: ["In the app", "Notification"],
};

/** "HH:MM" (24-hour) ⇄ hour 1-12, minute, AM/PM. */
function splitTime(value: string): { hour: string; minute: string; half: "AM" | "PM" } {
  const [h, m] = value.split(":").map(Number) as [number, number];
  return { hour: String(h % 12 === 0 ? 12 : h % 12), minute: String(m).padStart(2, "0"), half: h < 12 ? "AM" : "PM" };
}
function joinTime(hour: string, minute: string, half: "AM" | "PM"): string | null {
  const h = Number(hour);
  const m = Number(minute);
  if (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute) || h < 1 || h > 12 || m > 59) return null;
  const h24 = (h % 12) + (half === "PM" ? 12 : 0);
  return `${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** A small clock you type into: hour, minute, AM/PM. Keeps what you type; saves only a real time. */
function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const start = splitTime(value);
  const [hour, setHour] = useState(start.hour);
  const [minute, setMinute] = useState(start.minute);
  const [half, setHalf] = useState<"AM" | "PM">(start.half);
  const commit = (h: string, m: string, x: "AM" | "PM") => {
    const t = joinTime(h, m, x);
    if (t) onChange(t);
  };
  const box = { ...INPUT, width: 52, textAlign: "center" as const, fontSize: 18, fontWeight: 600, padding: 0 };
  const invalid = joinTime(hour, minute, half) === null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <input aria-label="Hour" inputMode="numeric" maxLength={2} value={hour} onChange={(e) => (setHour(e.target.value), commit(e.target.value, minute, half))} style={{ ...box, outline: invalid ? "1.5px solid #FF3B30" : undefined }} />
      <span style={{ fontSize: 18, fontWeight: 700 }}>:</span>
      <input
        aria-label="Minute"
        inputMode="numeric"
        maxLength={2}
        value={minute}
        onChange={(e) => (setMinute(e.target.value), commit(hour, e.target.value, half))}
        onBlur={() => minute.length === 1 && setMinute(minute.padStart(2, "0"))}
        style={{ ...box, outline: invalid ? "1.5px solid #FF3B30" : undefined }}
      />
      <Segmented label="AM or PM" options={["AM", "PM"]} value={half} onChange={(v) => (setHalf(v as "AM" | "PM"), commit(hour, minute, v as "AM" | "PM"))} />
    </div>
  );
}

/**
 * A WhatsApp invite: opens WhatsApp (app or web) with the message ready to send. With a number it goes straight to
 * that person's chat; without one WhatsApp asks who to send it to. tmrw never sends it by itself.
 */
function whatsAppInvite(shop: string, name: string, role: string, phone: string): string {
  const join = typeof window === "undefined" ? "" : ` Join here: ${window.location.origin}`;
  const text = `Hi ${name}, I've added you to ${shop} on tmrw as ${role}. You'll see the calendar and can send requests there, instead of WhatsApp.${join}`;
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const toggle = (list: string[], o: string) => (list.includes(o) ? list.filter((x) => x !== o) : [...list, o]);
/** Name, amount (right-aligned), schedule, and a fixed last column, so the header and every row line up. */
const TABLE = { display: "grid", gridTemplateColumns: "minmax(0, 1.5fr) 112px minmax(0, 1.1fr) 178px", columnGap: 16, alignItems: "center" } as const;
const HEAD = { ...TABLE, padding: "10px 0", fontSize: 12, fontWeight: 700, letterSpacing: ".04em", color: "#6E6E73", borderBottom: "1px solid rgba(0,0,0,.08)" } as const;

function Step({ n, a, set }: { n: number; a: Answers; set: (f: (a: Answers) => Answers) => void }) {
  const file = useRef<HTMLInputElement>(null);
  switch (n) {
    case 1:
      return (
        <>
          <Title sub="This shapes how tmrw expects your sales to move.">Your business</Title>
          <label htmlFor="tmrw-bn" className="tmrw-muted" style={{ fontSize: 13, fontWeight: 600 }}>
            Name
          </label>
          <input
            id="tmrw-bn"
            value={a.name}
            onChange={(e) => set((x) => ({ ...x, name: e.target.value }))}
            style={{ ...INPUT, display: "block", width: "100%", boxSizing: "border-box", height: 46, margin: "6px 0 18px", padding: "0 14px", fontSize: 16 }}
          />
          <Label>Type</Label>
          <Chips label="Type" options={["Bakery and café", "Clothing", "Grocery", "Salon", "Other"]} selected={[a.type]} onToggle={(o) => set((x) => ({ ...x, type: o }))} />
          <Label>Busiest days</Label>
          <Chips label="Busiest days" options={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]} selected={a.busyDays} onToggle={(o) => set((x) => ({ ...x, busyDays: toggle(x.busyDays, o) }))} />
          <Label>Busy seasons</Label>
          <Chips label="Busy seasons" options={a.seasonOptions} selected={a.seasons} onToggle={(o) => set((x) => ({ ...x, seasons: toggle(x.seasons, o) }))} />
          <div style={{ marginTop: -24 }}>
            <AddRow
              label="Add a season"
              fields={[{ name: "Season", placeholder: "Back to school" }]}
              onAdd={([s]) => set((x) => (x.seasonOptions.includes(s!) ? x : { ...x, seasonOptions: [...x.seasonOptions, s!], seasons: [...x.seasons, s!] }))}
            />
          </div>
        </>
      );
    case 2:
      return (
        <>
          <Title sub="tmrw reads your history to find what comes in and what goes out. It never moves money on its own.">Connect PayPal</Title>
          <div className="tmrw-card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 12, background: "#0070E0", color: "#fff", fontWeight: 800, fontSize: 18 }}>P</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{a.name || "Your shop"} on PayPal</p>
              <p style={{ margin: "3px 0 0", fontSize: 14.5, fontWeight: 600, color: "#1A7F37" }}>Connected - 14 months of history read</p>
            </div>
            <span aria-label="Connected" style={{ display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: "50%", background: "#1A9E45", color: "#fff", fontSize: 16, fontWeight: 800 }}>
              ✓
            </span>
          </div>
          <p className="tmrw-muted" style={{ margin: "14px 0 0", fontSize: 13 }}>
            Simulated: the demo shop&apos;s history is made up.
          </p>
        </>
      );
    case 3:
      return (
        <>
          <Title sub="6 found in your PayPal history. Tell tmrw which dates are fixed and which can move.">Your recurring expenses</Title>
          <div className="tmrw-card" style={{ padding: "4px 18px 0" }}>
            <div style={HEAD}>
              <span>EXPENSE</span>
              <span style={{ textAlign: "right" }}>AMOUNT</span>
              <span>SCHEDULE</span>
              <span>DATE</span>
            </div>
            {EXPENSES.map((o) => (
              <div key={o.name} style={{ ...TABLE, padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{o.name}</span>
                <span style={{ textAlign: "right", fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{o.amt}</span>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: "#3A3A3C" }}>
                  {o.when}
                  <span style={{ display: "block", fontSize: 12, color: "#6E6E73" }}>{o.how}</span>
                </span>
                <div>
                  <Segmented
                    label={`${o.name}: date`}
                    options={["Fixed date", "Can move"]}
                    value={a.movable[o.name] ? "Can move" : "Fixed date"}
                    onChange={(v) => set((x) => ({ ...x, movable: { ...x.movable, [o.name]: v === "Can move" } }))}
                  />
                </div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 12px", fontSize: 14, fontWeight: 700 }}>
              <span>Expenses each month</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: "#C4161C" }}>about $4,839</span>
            </div>
          </div>
        </>
      );
    case 4:
      return (
        <>
          <Title sub="2 found in your PayPal history: what your sales bring in, and the invoices clients owe you.">Your expected revenue</Title>
          <div className="tmrw-card" style={{ padding: "4px 18px 0" }}>
            <div style={HEAD}>
              <span>SOURCE</span>
              <span style={{ textAlign: "right" }}>AMOUNT</span>
              <span>SCHEDULE</span>
              <span>NOTE</span>
            </div>
            {REVENUE.map((o) => (
              <div key={o.name} style={{ ...TABLE, padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{o.name}</span>
                <span style={{ textAlign: "right", fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "#1E7F3C", whiteSpace: "nowrap" }}>{o.amt}</span>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: "#3A3A3C" }}>
                  {o.when}
                  <span style={{ display: "block", fontSize: 12, color: "#6E6E73" }}>{o.how}</span>
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#3A3A3C" }}>{o.note}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 12px", fontSize: 14, fontWeight: 700 }}>
              <span>Revenue each month</span>
              <span style={{ fontVariantNumeric: "tabular-nums", color: "#1E7F3C" }}>about $6,900</span>
            </div>
          </div>
        </>
      );
    case 5:
      return (
        <>
          <Title sub="Add them so your calendar is complete.">Any payments you make or receive outside PayPal?</Title>
          <div className="tmrw-card" style={{ padding: "4px 18px" }}>
            {a.outside.length + a.uploads.length === 0 && (
              <p className="tmrw-muted" style={{ margin: "14px 0", fontSize: 14 }}>
                Nothing outside PayPal yet.
              </p>
            )}
            {a.outside.map((o, i) => (
              <div key={`${o.name}${i}`} className="tmrw-row">
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{o.name}</p>
                  <p className="tmrw-muted" style={{ margin: "1px 0 0", fontSize: 13 }}>
                    {o.detail}
                  </p>
                </div>
                <Segmented
                  label={`${o.name}: expense or revenue`}
                  options={["Expense", "Revenue"]}
                  value={o.kind}
                  onChange={(v) => set((x) => ({ ...x, outside: x.outside.map((y, j) => (j === i ? { ...y, kind: v as Kind } : y)) }))}
                />
                <RemoveButton label={`Remove ${o.name}`} onClick={() => set((x) => ({ ...x, outside: x.outside.filter((_, j) => j !== i) }))} />
              </div>
            ))}
            {a.uploads.map((u, i) => (
              <div key={`${u}${i}`} className="tmrw-row">
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{u}</p>
                  <p className="tmrw-muted" style={{ margin: "1px 0 0", fontSize: 13 }}>
                    Pip will read it and add what it finds. Simulated.
                  </p>
                </div>
                <RemoveButton label={`Remove ${u}`} onClick={() => set((x) => ({ ...x, uploads: x.uploads.filter((_, j) => j !== i) }))} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <AddRow
              label="Add a payment"
              fields={[
                { name: "Payment", placeholder: "Who or what" },
                { name: "Amount and when", placeholder: "$90 - every Monday", width: 200 },
              ]}
              onAdd={([name, detail]) => set((x) => ({ ...x, outside: [...x.outside, { name: name!, detail: detail || "No date yet", kind: "Expense" }] }))}
            />
            <button className="tmrw-chip" style={{ marginTop: 12 }} onClick={() => file.current?.click()}>
              Upload a statement or bill
            </button>
            <input
              ref={file}
              type="file"
              accept="image/*,.pdf"
              aria-label="Upload a statement or bill"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) set((x) => ({ ...x, uploads: [...x.uploads, f.name] }));
                e.target.value = "";
              }}
            />
          </div>
        </>
      );
    case 6:
      return (
        <>
          <Title sub="Clients who buy on credit or invoice. tmrw sends friendly reminders only if the client agrees.">Who pays you later?</Title>
          {a.clients.length === 0 && (
            <p className="tmrw-muted" style={{ margin: "0 0 8px", fontSize: 14 }}>
              No clients on credit yet.
            </p>
          )}
          {a.clients.map((c, i) => {
            const update = (patch: Partial<Answers["clients"][number]>) => set((x) => ({ ...x, clients: x.clients.map((y, j) => (j === i ? { ...y, ...patch } : y)) }));
            return (
              <div key={`${c.name}${i}`} className="tmrw-card" style={{ padding: "18px 20px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 16, flex: 1 }}>{c.name}</p>
                  <p className="tmrw-muted" style={{ margin: 0, fontSize: 14 }}>
                    {c.note}
                  </p>
                  <RemoveButton label={`Remove ${c.name}`} onClick={() => set((x) => ({ ...x, clients: x.clients.filter((_, j) => j !== i) }))} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontSize: 14 }}>
                  <span>Payment reminders</span>
                  <Switch label={`Payment reminders for ${c.name}`} on={c.reminders} onChange={(on) => update({ reminders: on })} />
                </div>
                {c.reminders && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 14 }}>
                    <span>Tone</span>
                    <Segmented label={`Reminder tone for ${c.name}`} options={["Gentle", "Firm"]} value={c.tone} onChange={(tone) => update({ tone })} />
                  </div>
                )}
              </div>
            );
          })}
          <AddRow
            label="Add a client"
            fields={[
              { name: "Client", placeholder: "Client name" },
              { name: "How they pay", placeholder: "pays on time", width: 180 },
            ]}
            onAdd={([name, note]) => set((x) => ({ ...x, clients: [...x.clients, { name: name!, note: note || "new client", reminders: true, tone: "Gentle" }] }))}
          />
        </>
      );
    case 7:
      return (
        <>
          <Title sub="The least money that should always stay in the account. Every plan is built above this line.">Your safety cushion</Title>
          <p style={{ margin: 0, fontSize: 56, fontWeight: 700, letterSpacing: "-.03em" }}>${a.cushion.toLocaleString("en-US")}</p>
          <input
            aria-label="Safety cushion"
            className="tmrw-range"
            type="range"
            min={0}
            max={1000}
            step={50}
            value={a.cushion}
            onChange={(e) => set((x) => ({ ...x, cushion: Number(e.target.value) }))}
            style={{ margin: "18px 0 8px" }}
          />
          <div className="tmrw-muted" style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span>$0</span>
            <span>$1,000</span>
          </div>
        </>
      );
    case 8:
      return (
        <>
          <Title sub="Optional. A new product, an event, a bigger kitchen. tmrw finds the money for it after every bill is safe.">Anything you&apos;re planning to grow?</Title>
          <div className="tmrw-card" style={{ padding: "4px 20px", fontSize: 15 }}>
            <div className="tmrw-muted" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 28px", gap: 14, padding: "12px 0 8px", fontSize: 12, fontWeight: 600 }}>
              <span>Plan</span>
              <span>Rough cost</span>
              <span>By</span>
              <span />
            </div>
            {a.plans.length === 0 && (
              <p className="tmrw-muted" style={{ margin: "8px 0 14px", fontSize: 14 }}>
                No plans yet.
              </p>
            )}
            {a.plans.map((p, i) => (
              <div key={`${p.plan}${i}`} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 28px", gap: 14, alignItems: "center", padding: "10px 0", borderTop: "1px solid rgba(0,0,0,.07)", fontWeight: 600 }}>
                <span>{p.plan}</span>
                <span>{p.cost}</span>
                <span>{p.by}</span>
                <RemoveButton label={`Remove ${p.plan}`} onClick={() => set((x) => ({ ...x, plans: x.plans.filter((_, j) => j !== i) }))} />
              </div>
            ))}
          </div>
          <AddRow
            label="Add a plan"
            fields={[
              { name: "Plan", placeholder: "A coffee machine" },
              { name: "Rough cost", placeholder: "$900", width: 100 },
              { name: "By", placeholder: "Sat 19 Dec", width: 120 },
            ]}
            onAdd={([plan, cost, by]) => set((x) => ({ ...x, plans: [...x.plans, { plan: plan!, cost: cost || "-", by: by || "No date" }] }))}
          />
        </>
      );
    case 9:
      return (
        <>
          <Title sub="Add the people who work in your shop and invite them on WhatsApp. You can do this later. Only you approve money.">Your team</Title>
          {a.team.length === 0 && (
            <p className="tmrw-muted" style={{ margin: "0 0 8px", fontSize: 14 }}>
              Just you for now.
            </p>
          )}
          {a.team.map((t, i) => (
            <div key={`${t.name}${i}`} className="tmrw-row">
              <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: "50%", background: COLOURS[i % COLOURS.length], color: "#fff", fontWeight: 700 }}>
                {t.name.charAt(0).toUpperCase()}
              </span>
              <p style={{ flex: 1, margin: 0, fontWeight: 600 }}>{t.name}</p>
              <span className="tmrw-chip" style={{ height: 30, cursor: "default" }}>
                {t.role}
              </span>
              <a
                href={whatsAppInvite(a.name || "my shop", t.name, t.role, t.phone)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Invite ${t.name} on WhatsApp`}
                style={{ display: "inline-flex", alignItems: "center", height: 30, padding: "0 12px", borderRadius: 99, background: "#25D366", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}
              >
                Invite
              </a>
              <RemoveButton label={`Remove ${t.name}`} onClick={() => set((x) => ({ ...x, team: x.team.filter((_, j) => j !== i) }))} />
            </div>
          ))}
          <AddRow
            label="Add a member"
            fields={[
              { name: "Name", placeholder: "Name" },
              { name: "Role", placeholder: "Role, e.g. Baker", width: 150 },
              { name: "WhatsApp number", placeholder: "WhatsApp number", width: 170 },
            ]}
            onAdd={([name, role, phone]) => set((x) => ({ ...x, team: [...x.team, { name: name!, role: role || "Staff", phone: phone ?? "" }] }))}
          />
        </>
      );
    default:
      return (
        <>
          <Title sub="A calm note from Pip each morning. Four lines, at most one decision.">Your daily brief</Title>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,.07)" }}>
            <span style={{ fontWeight: 600 }}>Time</span>
            <TimeField value={a.briefTime} onChange={(briefTime) => set((x) => ({ ...x, briefTime }))} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: "14px 0 0" }}>
            <span style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
              Where{" "}
              <span className="tmrw-muted" style={{ fontWeight: 400, fontSize: 13 }}>
                pick any
              </span>
            </span>
            <Chips label="Where to send the daily brief" options={["In the app", "Notification", "WhatsApp", "Email"]} selected={a.channels} onToggle={(o) => set((x) => ({ ...x, channels: toggle(x.channels, o) }))} />
          </div>
          {a.channels.length === 0 && <p style={{ margin: 0, fontSize: 13, color: "#C4161C", fontWeight: 600 }}>Pick at least one place, or you won&apos;t see the brief.</p>}
        </>
      );
  }
}

/** Is this step's answer complete enough to go on? */
function canContinue(step: number, a: Answers): boolean {
  if (step === 1) return a.name.trim().length > 0 && a.type.length > 0;
  if (step === SETUP_STEPS) return a.channels.length > 0;
  return true;
}

const SAVE_FAILED = "Your answers couldn't be saved, so tmrw is using the demo shop's for now.";

/** Stage 2: setup, one-tap steps over the blurred station. "Start my day" saves the answers on the shop. */
export function Setup({ step, onNext, onBack }: { step: number; onNext: () => void; onBack: () => void }) {
  const [a, setA] = useState<Answers>(START);
  const [saving, setSaving] = useState(false);
  const last = step === SETUP_STEPS;
  const nextLabel = last ? (saving ? "Saving" : "Start my day") : step === 2 ? "Continue" : "Looks right";
  const optional = step === 8 || step === 9;
  const ok = canContinue(step, a);

  const next = async () => {
    if (!ok || saving) return;
    if (!last) return onNext();
    setSaving(true);
    try {
      const result = await saveSetup({
        name: a.name,
        type: a.type,
        cushionDollars: a.cushion,
        seasons: a.seasons,
        busyDays: a.busyDays as ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[],
        movable: Object.fromEntries(EXPENSES.map((e) => [e.name, a.movable[e.name] ?? false])),
        outside: a.outside,
        clients: a.clients.map((c) => ({ ...c, tone: c.tone === "Firm" ? "Firm" : "Gentle" })),
        plans: a.plans,
        team: a.team,
        briefTime: a.briefTime,
        briefChannels: a.channels as ("In the app" | "Notification" | "WhatsApp" | "Email")[],
      });
      if (!result.ok) console.warn(SAVE_FAILED);
    } catch {
      console.warn(SAVE_FAILED);
    } finally {
      setSaving(false);
    }
    onNext();
  };

  return (
    <div className="tmrw-layer" style={{ display: "grid", placeItems: "center", background: "rgba(10,20,35,.3)" }}>
      <div className="tmrw-glass" style={{ width: 660, maxHeight: 860, overflowY: "auto", boxSizing: "border-box", borderRadius: 28, padding: "30px 36px 28px", boxShadow: "0 30px 80px rgba(0,0,0,.25)" }}>
        <p className="tmrw-muted" style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>
          Setting up your calendar: {step} of {SETUP_STEPS}
        </p>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={SETUP_STEPS}
          aria-valuenow={step}
          aria-label="Setup progress"
          style={{ height: 4, borderRadius: 4, background: "rgba(0,0,0,.08)", margin: "10px 0 26px", overflow: "hidden" }}
        >
          <div style={{ height: "100%", width: `${(step / SETUP_STEPS) * 100}%`, background: "#0071E3", borderRadius: 4, transition: "width .5s cubic-bezier(.2,.8,.2,1)" }} />
        </div>
        <div key={step} className="tmrw-fade-up">
          <Step n={step} a={a} set={setA} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 28 }}>
          <button className="tmrw-btn tmrw-pill tmrw-ghost" onClick={onBack}>
            Back
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            {optional && (
              <button className="tmrw-btn tmrw-pill tmrw-ghost" onClick={onNext}>
                Skip
              </button>
            )}
            <button className="tmrw-btn tmrw-pill tmrw-blue" onClick={next} disabled={!ok || saving} style={{ opacity: ok ? 1 : 0.5 }}>
              {nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
