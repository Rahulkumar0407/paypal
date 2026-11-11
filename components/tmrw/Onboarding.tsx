"use client";

import { useRef, useState, type ReactNode } from "react";
import { SETUP_STEPS } from "./useStage";

/** The wordmark: "tm" in PayPal navy, "rw" in PayPal blue, split the way "Pay" and "Pal" are. */
export function Wordmark({ size = 58 }: { size?: number }) {
  return (
    <span className="tmrw-wordmark" style={{ fontSize: size, display: "block" }}>
      <span style={{ color: "#003087" }}>tm</span>
      <span style={{ color: "#009CDE" }}>rw</span>
    </span>
  );
}

/** Stage 1: the login card over the blurred station. */
export function Login({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="tmrw-layer" style={{ display: "grid", placeItems: "center", background: "rgba(10,20,35,.25)" }}>
      <div className="tmrw-glass tmrw-fade-up" style={{ width: 420, borderRadius: 28, padding: "40px 40px 32px", textAlign: "center", boxShadow: "0 30px 80px rgba(0,0,0,.25)" }}>
        <h1 style={{ margin: 0 }}>
          <Wordmark />
        </h1>
        <p className="tmrw-muted" style={{ margin: "12px 0 30px", fontSize: 17 }}>
          Know tomorrow before it arrives.
        </p>
        <button className="tmrw-btn tmrw-pill" onClick={onContinue} style={{ width: "100%", height: 50, fontSize: 16, background: "#0070E0", color: "#fff" }}>
          Continue with PayPal
        </button>
        <button className="tmrw-btn tmrw-pill tmrw-ghost" onClick={onContinue} style={{ width: "100%", height: 50, marginTop: 10, fontSize: 16 }}>
          Continue with email
        </button>
        <p className="tmrw-muted" style={{ margin: "22px 0 0", fontSize: 13 }}>
          New here? Setup takes about two minutes.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small controls
// ---------------------------------------------------------------------------

function Chips({ options, initial }: { options: string[]; initial: string[] }) {
  const [on, setOn] = useState(new Set(initial));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
      {options.map((o) => (
        <button
          key={o}
          className="tmrw-chip"
          aria-pressed={on.has(o)}
          onClick={() =>
            setOn((prev) => {
              const next = new Set(prev);
              if (next.has(o)) next.delete(o);
              else next.add(o);
              return next;
            })
          }
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Segmented({ options, initial, label }: { options: string[]; initial: string; label: string }) {
  const [value, setValue] = useState(initial);
  return (
    <div className="tmrw-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o} aria-pressed={value === o} onClick={() => setValue(o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Switch({ label, initial = true }: { label: string; initial?: boolean }) {
  const [on, setOn] = useState(initial);
  return <button className="tmrw-switch" role="switch" aria-checked={on} aria-label={label} onClick={() => setOn(!on)} />;
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
  const submit = () => {
    if (!ready) return;
    onAdd(values.map((v) => v.trim()));
    setValues(fields.map(() => ""));
    setOpen(false);
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center" }}
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
      <button type="submit" className="tmrw-btn tmrw-pill tmrw-blue" style={{ height: 40 }} disabled={!ready}>
        Add
      </button>
      <button type="button" className="tmrw-btn tmrw-pill tmrw-ghost" style={{ height: 40 }} onClick={() => setOpen(false)}>
        Cancel
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// What setup starts with: the demo shop, found from its (simulated) PayPal history
// ---------------------------------------------------------------------------

const EXPENSES = [
  { name: "Rent", amt: "$1,500", when: "12th, monthly", how: "Bank transfer", movable: false },
  { name: "Bean There - coffee beans", amt: "$400", when: "Every 10 days", how: "PayPal", movable: true },
  { name: "Internet", amt: "$60", when: "3rd, monthly", how: "Auto-debit", movable: false },
  { name: "Card machine", amt: "$49", when: "13th, monthly", how: "Auto-debit", movable: false },
  { name: "Oven loan", amt: "$250", when: "25th, monthly", how: "Auto-debit", movable: false },
  { name: "Staff pay", amt: "$1,600", when: "28th, monthly", how: "PayPal", movable: false },
];
const REVENUE = [
  { name: "Daily sales", amt: "$180-$320", when: "Every day", how: "PayPal", note: "More on weekends" },
  { name: "Ivory & Vow - wedding cake", amt: "$240", when: "Due 18 Nov", how: "Invoice", note: "Usually 5 days late" },
];
const COLOURS = ["#AF52DE", "#FF9500", "#34C759", "#0071E3", "#FF2D55", "#5856D6"];

interface SetupLists {
  outside: { name: string; detail: string; kind: "Expense" | "Revenue" }[];
  uploads: string[];
  clients: { name: string; note: string }[];
  plans: { plan: string; cost: string; by: string }[];
  team: { name: string; role: string }[];
}

const START: SetupLists = {
  outside: [
    { name: "Oat of Office - oat milk", detail: "$180 - bank auto-debit on the 15th", kind: "Expense" },
    { name: "Weekend market - cash sales", detail: "about $150 - every Saturday", kind: "Revenue" },
  ],
  uploads: [],
  clients: [{ name: "Ivory & Vow - wedding planner", note: "usually pays 5 days late" }],
  plans: [
    { plan: "Stall at the Winter Makers' Market", cost: "$300", by: "Sun 6 Dec" },
    { plan: "Launch Christmas cookie boxes", cost: "$450", by: "Sat 12 Dec" },
  ],
  team: [
    { name: "Flo", role: "Head baker" },
    { name: "Marco", role: "Barista" },
    { name: "Pam", role: "Front counter" },
  ],
};

const TABLE = { display: "grid", gridTemplateColumns: "1.7fr .8fr 1.3fr auto", gap: 12, alignItems: "center" } as const;
const HEAD = { ...TABLE, padding: "10px 0", fontSize: 12, fontWeight: 700, letterSpacing: ".04em", color: "#6E6E73", borderBottom: "1px solid rgba(0,0,0,.08)" } as const;
const KindTag = ({ kind }: { kind: "Expense" | "Revenue" }) => (
  <span style={{ fontSize: 13, fontWeight: 600, color: kind === "Expense" ? "#C4161C" : "#1E7F3C" }}>{kind}</span>
);

function Step({ n, lists, setLists }: { n: number; lists: SetupLists; setLists: (f: (l: SetupLists) => SetupLists) => void }) {
  const [cushion, setCushion] = useState(200);
  const file = useRef<HTMLInputElement>(null);
  switch (n) {
    case 1:
      return (
        <>
          <Title sub="This shapes how tmrw expects your sales to move.">Your business</Title>
          <label htmlFor="tmrw-bn" className="tmrw-muted" style={{ fontSize: 13, fontWeight: 600 }}>
            Name
          </label>
          <input id="tmrw-bn" defaultValue="Dunder Mifflin & Co." style={{ ...INPUT, display: "block", width: "100%", boxSizing: "border-box", height: 46, margin: "6px 0 18px", padding: "0 14px", fontSize: 16 }} />
          <Label>Type</Label>
          <Chips options={["Bakery and café", "Clothing", "Grocery", "Salon", "Other"]} initial={["Bakery and café"]} />
          <Label>Busiest days</Label>
          <Chips options={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]} initial={["Sat", "Sun"]} />
          <Label>Busy seasons</Label>
          <Chips options={["Christmas", "Weddings", "Diwali", "Summer"]} initial={["Christmas", "Weddings"]} />
        </>
      );
    case 2:
      return (
        <>
          <Title sub="tmrw reads your history to find what comes in and what goes out. It never moves money on its own.">Connect PayPal</Title>
          <div className="tmrw-card" style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 12, background: "#0070E0", color: "#fff", fontWeight: 800, fontSize: 18 }}>P</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>Dunder Mifflin &amp; Co. on PayPal</p>
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
              <span style={{ width: 178 }}>DATE</span>
            </div>
            {EXPENSES.map((o) => (
              <div key={o.name} style={{ ...TABLE, padding: "6px 0", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{o.name}</span>
                <span style={{ textAlign: "right", fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{o.amt}</span>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: "#3A3A3C" }}>
                  {o.when}
                  <span style={{ display: "block", fontSize: 12, color: "#6E6E73" }}>{o.how}</span>
                </span>
                <div style={{ width: 178 }}>
                  <Segmented label={`${o.name}: date`} options={["Fixed date", "Can move"]} initial={o.movable ? "Can move" : "Fixed date"} />
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
              <span style={{ width: 178 }}>NOTE</span>
            </div>
            {REVENUE.map((o) => (
              <div key={o.name} style={{ ...TABLE, padding: "8px 0", borderBottom: "1px solid rgba(0,0,0,.06)" }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>{o.name}</span>
                <span style={{ textAlign: "right", fontSize: 15, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: "#1E7F3C", whiteSpace: "nowrap" }}>{o.amt}</span>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: "#3A3A3C" }}>
                  {o.when}
                  <span style={{ display: "block", fontSize: 12, color: "#6E6E73" }}>{o.how}</span>
                </span>
                <span style={{ width: 178, fontSize: 13, fontWeight: 600, color: "#3A3A3C" }}>{o.note}</span>
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
            {lists.outside.map((o, i) => (
              <div key={`${o.name}${i}`} className="tmrw-row" style={i === lists.outside.length - 1 ? { border: 0 } : undefined}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{o.name}</p>
                  <p className="tmrw-muted" style={{ margin: "1px 0 0", fontSize: 13 }}>
                    {o.detail}
                  </p>
                </div>
                <KindTag kind={o.kind} />
              </div>
            ))}
            {lists.uploads.map((u) => (
              <div key={u} className="tmrw-row" style={{ border: 0 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 600 }}>{u}</p>
                  <p className="tmrw-muted" style={{ margin: "1px 0 0", fontSize: 13 }}>
                    Pip will read it and add what it finds. Simulated.
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", flexWrap: "wrap" }}>
            <AddRow
              label="Add a payment"
              fields={[
                { name: "Payment", placeholder: "Who or what" },
                { name: "Amount and when", placeholder: "$90 - every Monday", width: 170 },
                { name: "Expense or revenue", placeholder: "Expense", width: 100 },
              ]}
              onAdd={([name, detail, kind]) =>
                setLists((l) => ({ ...l, outside: [...l.outside, { name: name!, detail: detail || "No date yet", kind: /rev|in/i.test(kind ?? "") ? "Revenue" : "Expense" }] }))
              }
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
                if (f) setLists((l) => ({ ...l, uploads: [...l.uploads, f.name] }));
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
          {lists.clients.map((c, i) => (
            <div key={`${c.name}${i}`} className="tmrw-card" style={{ padding: "18px 20px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>{c.name}</p>
                <p className="tmrw-muted" style={{ margin: 0, fontSize: 14 }}>
                  {c.note}
                </p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, fontSize: 14 }}>
                <span>Payment reminders</span>
                <Switch label={`Payment reminders for ${c.name}`} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, fontSize: 14 }}>
                <span>Tone</span>
                <Segmented label={`Reminder tone for ${c.name}`} options={["Gentle", "Firm"]} initial="Gentle" />
              </div>
            </div>
          ))}
          <AddRow
            label="Add a client"
            fields={[
              { name: "Client", placeholder: "Client name" },
              { name: "How they pay", placeholder: "pays on time", width: 180 },
            ]}
            onAdd={([name, note]) => setLists((l) => ({ ...l, clients: [...l.clients, { name: name!, note: note || "new client" }] }))}
          />
        </>
      );
    case 7:
      return (
        <>
          <Title sub="The least money that should always stay in the account. Every plan is built above this line.">Your safety cushion</Title>
          <p style={{ margin: 0, fontSize: 56, fontWeight: 700, letterSpacing: "-.03em" }}>${cushion.toLocaleString("en-US")}</p>
          <input aria-label="Safety cushion" className="tmrw-range" type="range" min={0} max={1000} step={50} value={cushion} onChange={(e) => setCushion(Number(e.target.value))} style={{ margin: "18px 0 8px" }} />
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
            <div className="tmrw-muted" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, padding: "12px 0 8px", fontSize: 12, fontWeight: 600 }}>
              <span>Plan</span>
              <span>Rough cost</span>
              <span>By</span>
            </div>
            {lists.plans.map((p, i) => (
              <div key={`${p.plan}${i}`} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, padding: "12px 0", borderTop: "1px solid rgba(0,0,0,.07)", fontWeight: 600 }}>
                <span>{p.plan}</span>
                <span>{p.cost}</span>
                <span>{p.by}</span>
              </div>
            ))}
          </div>
          <AddRow
            label="Add a plan"
            fields={[
              { name: "Plan", placeholder: "A coffee machine" },
              { name: "Rough cost", placeholder: "$900", width: 100 },
              { name: "By", placeholder: "March", width: 110 },
            ]}
            onAdd={([plan, cost, by]) => setLists((l) => ({ ...l, plans: [...l.plans, { plan: plan!, cost: cost || "-", by: by || "No date" }] }))}
          />
        </>
      );
    case 9:
      return (
        <>
          <Title sub="Add the people who work in your shop. You can do this later. Only you approve money.">Your team</Title>
          {lists.team.map((t, i) => (
            <div key={`${t.name}${i}`} className="tmrw-row">
              <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 36, height: 36, borderRadius: "50%", background: COLOURS[i % COLOURS.length], color: "#fff", fontWeight: 700 }}>
                {t.name.charAt(0).toUpperCase()}
              </span>
              <p style={{ flex: 1, margin: 0, fontWeight: 600 }}>{t.name}</p>
              <span className="tmrw-chip" style={{ height: 30, cursor: "default" }}>
                {t.role}
              </span>
            </div>
          ))}
          <AddRow
            label="Add a member"
            fields={[
              { name: "Name", placeholder: "Name" },
              { name: "Role", placeholder: "Role, e.g. Baker", width: 200 },
            ]}
            onAdd={([name, role]) => setLists((l) => ({ ...l, team: [...l.team, { name: name!, role: role || "Staff" }] }))}
          />
        </>
      );
    default:
      return (
        <>
          <Title sub="A calm note from Pip each morning. Four lines, at most one decision.">Your daily brief</Title>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(0,0,0,.07)" }}>
            <span style={{ fontWeight: 600 }}>Time</span>
            <input aria-label="Daily brief time" type="time" defaultValue="08:00" style={{ ...INPUT, fontSize: 17, fontWeight: 600 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0 0" }}>
            <span style={{ fontWeight: 600 }}>
              Where{" "}
              <span className="tmrw-muted" style={{ fontWeight: 400, fontSize: 13 }}>
                pick any
              </span>
            </span>
            <Chips options={["In the app", "Notification", "WhatsApp", "Email"]} initial={["In the app", "Notification"]} />
          </div>
        </>
      );
  }
}

/** Stage 2: setup, one-tap steps over the blurred station. */
export function Setup({ step, onNext, onBack }: { step: number; onNext: () => void; onBack: () => void }) {
  const [lists, setLists] = useState<SetupLists>(START);
  const nextLabel = step === SETUP_STEPS ? "Start my day" : step === 2 ? "Continue" : "Looks right";
  const optional = step === 8 || step === 9;
  return (
    <div className="tmrw-layer" style={{ display: "grid", placeItems: "center", background: "rgba(10,20,35,.3)" }}>
      <div className="tmrw-glass" style={{ width: 660, borderRadius: 28, padding: "30px 36px 28px", boxShadow: "0 30px 80px rgba(0,0,0,.25)" }}>
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
          <Step n={step} lists={lists} setLists={setLists} />
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
            <button className="tmrw-btn tmrw-pill tmrw-blue" onClick={onNext}>
              {nextLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
