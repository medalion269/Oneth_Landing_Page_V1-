"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, CircleCheck, MessageSquare, RotateCcw } from "lucide-react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import Stage from "./Stage";
import { InvoiceDoc } from "./Documents";
import { CursorPointer } from "./icons";
import { AppCard, AppRail, AppTopBar, Chip, ConfidenceBar, ICON, ICON_SM, PillButton } from "./app/ui";
import { approvalAnimation, useGSAP } from "@/lib/animations";
import { aed, client, evidence, explanation, firm, formatTrn, invoice, precedentBills, preparedEntry } from "@/lib/demo-data";

/*
 * Review: the oneth app's Decision screen (frontend/src/app/decisions/detail: DocumentCard, RecordCard, ActionsCard,
 * HistoryCard). The decision record writes itself in, section by section, in the order a reviewer reads it; then a
 * person approves. oneth runs in shadow mode: it proposes, people decide, and nothing is written to the books.
 */

const [costLine, vatLine, payableLine] = preparedEntry.lines;
const ISSUE = `Classify ${invoice.supplierShort} invoice ${invoice.number}`;
const RULE = "Input VAT on a valid tax invoice · v3";
const POLICY = "Office consumables go to 6120";
const NOT_WRITTEN = "oneth only proposes. Nothing is written to your books.";

/** Label and value rows, as the app's FieldList. */
function Fields({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="flex flex-col">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4 border-b border-line-soft py-1 last:border-0">
          <dt className="shrink-0 text-[13px] text-muted">{label}</dt>
          <dd className="min-w-0 truncate text-right text-[13px] text-ink tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** One section of the record. The cover uncovers it left to right when the timeline writes it in. */
function Section({ label, hl, children }: { label: string; hl?: string; children: ReactNode }) {
  return (
    <div data-ap-section data-ap-hl={hl} className="flex flex-col gap-1">
      <p data-ap-section-label className="text-[12px] font-semibold text-muted">
        {label}
      </p>
      <div className="relative">
        {children}
        <span data-ap-cover aria-hidden className="absolute -inset-0.5 origin-right bg-paper" style={{ transform: "scaleX(0)" }} />
      </div>
    </div>
  );
}

function Journal() {
  return (
    <table className="w-full table-fixed text-[13px] tabular-nums">
      <colgroup>
        <col />
        <col className="w-[76px]" />
        <col className="w-[76px]" />
      </colgroup>
      <thead>
        <tr className="text-left text-[12px] text-muted">
          <th className="pb-1 font-normal">Account</th>
          <th className="pb-1 text-right font-normal">Debit</th>
          <th className="pb-1 text-right font-normal">Credit</th>
        </tr>
      </thead>
      <tbody>
        {preparedEntry.lines.map((l) => (
          <tr key={l.code} className="border-t border-line-soft">
            <td className="truncate py-1 pr-2">
              <span className="mr-1.5 text-muted">{l.code}</span>
              {l.account}
            </td>
            <td className="py-1 text-right">{l.debit ? aed(l.debit) : ""}</td>
            <td className="py-1 text-right">{l.credit ? aed(l.credit) : ""}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** The status chips cross-fade from Needs review (the app's chip for a decision awaiting review) to Approved. */
function StatusChips() {
  return (
    <span className="stack">
      <span data-ap-status-ready className="justify-self-end" style={{ opacity: 0 }}>
        <Chip size="sm" tone="review">
          Needs review
        </Chip>
      </span>
      <span data-ap-status-approved className="justify-self-end">
        <Chip size="sm" tone="done">
          Approved
        </Chip>
      </span>
    </span>
  );
}

function RecordCard() {
  return (
    <AppCard
      data-ap-panel
      title="Decision record"
      className="col-span-5 h-full overflow-hidden"
      action={
        <>
          <Chip size="sm" tone="neutral">
            Classification
          </Chip>
          <StatusChips />
        </>
      }
    >
      {/* The record is longer than the card: its bottom shows when finished, and the timeline scrolls it as it writes. */}
      <div data-ap-record-window className="relative flex min-h-0 flex-1 flex-col justify-end overflow-hidden">
        <div data-ap-record-body className="flex flex-col gap-3">
          <Section label="Issue">
            <p className="text-[14px] font-semibold text-ink">{ISSUE}</p>
          </Section>
          <Section label="Evidence" hl="trn vat total">
            <Fields
              rows={[
                ["Supplier", invoice.supplier],
                ["Supplier TRN", formatTrn(invoice.supplierTrn)],
                ["Invoice", `${invoice.number} · ${invoice.date}`],
                ["Net · VAT · total", `${aed(invoice.net)} · ${aed(invoice.vat)} · ${aed(invoice.total)}`],
              ]}
            />
          </Section>
          <Section label="Context">
            <Fields
              rows={[
                ["Client", client.name],
                ["Period", "Nov 2026"],
                ["Supplier mapping", `${costLine.code} · ${costLine.account} · SR`],
              ]}
            />
          </Section>
          <Section label="Rule, policy and precedents">
            <Fields
              rows={[
                ["Rule", RULE],
                ["Policy", POLICY],
                ["Precedents", `${precedentBills} applied`],
              ]}
            />
          </Section>
          <Section label="Proposal" hl="lines">
            <Journal />
          </Section>
          <Section label="Reasoning">
            <p className="text-[13px] leading-[18px] text-ink">{explanation}</p>
          </Section>
          <Section label="Confidence">
            <span className="flex items-center gap-2">
              <ConfidenceBar value={0.94} />
              <span className="text-[13px] text-muted">High</span>
            </span>
          </Section>
        </div>
      </div>
    </AppCard>
  );
}

function ApproveButton() {
  return (
    <span data-ap-approve className="relative inline-grid h-10 w-full place-items-center overflow-hidden rounded-full bg-ink text-[14px] font-semibold text-white">
      <span data-ap-approve-hover aria-hidden className="absolute inset-0 bg-white/12" style={{ opacity: 0 }} />
      <span className="stack relative">
        <span data-ap-approve-label className="inline-flex items-center justify-center gap-1.5" style={{ opacity: 0 }}>
          Approve
        </span>
        <span data-ap-approved-label className="inline-flex items-center justify-center gap-1.5">
          <Check {...ICON_SM} strokeWidth={2.4} /> Approved
        </span>
      </span>
    </span>
  );
}

function ActionsAndHistory() {
  return (
    <div data-ap-actions className="col-span-3 flex flex-col gap-4">
      <AppCard title="Actions">
        <div className="flex flex-col gap-2">
          <ApproveButton />
          <PillButton variant="secondary" className="w-full">
            <RotateCcw {...ICON_SM} /> Overturn
          </PillButton>
          <PillButton variant="secondary" className="w-full">
            <MessageSquare {...ICON_SM} /> Ask client
          </PillButton>
        </div>
        <span className="flex items-center gap-2 text-[13px] text-ink">
          <span className="grid size-4 place-items-center rounded-[5px] bg-ink text-white">
            <Check size={11} strokeWidth={3} />
          </span>
          Save as precedent
        </span>
      </AppCard>
      <AppCard title="History">
        <div className="flex flex-col gap-2 text-[13px]">
          <p className="leading-[18px]">
            <span className="font-semibold">
              <Brand />
            </span>{" "}
            proposed 6120 Office supplies
            <span className="block text-[12px] text-faint">{preparedEntry.preparedAt}</span>
          </p>
          <span className="stack">
            <span data-ap-audit-pending className="text-[12px] text-muted" style={{ opacity: 0 }}>
              {NOT_WRITTEN}
            </span>
            <span data-ap-audit-done className="leading-[18px]">
              <span className="font-semibold">{firm.reviewer}</span> approved and saved a precedent
              <span className="block text-[12px] text-faint">{preparedEntry.approvedAt}</span>
            </span>
          </span>
        </div>
      </AppCard>
    </div>
  );
}

function DesktopScene() {
  return (
    <Stage
      width={1200}
      height={600}
      label={`The oneth app's Decision screen for invoice ${invoice.number} from ${invoice.supplier}. The decision record lists the issue, the evidence from the invoice, the context, the rule, the firm's policy and ${precedentBills} precedents, the proposed journal (6120 Office supplies ${aed(invoice.net)}, input VAT ${aed(invoice.vat)}, payable ${aed(invoice.total)}), the reasoning and a high confidence. ${firm.reviewer} approves it and saves it as a precedent. Nothing is written to the books.`}
    >
      <div className="absolute inset-0 flex overflow-hidden rounded-[18px] border border-line bg-canvas font-app text-ink antialiased shadow-float">
        <AppRail active="decisions" badge={13} />
        <div className="flex min-w-0 flex-1 flex-col px-6 pb-6">
          <AppTopBar title="Decision" />
          <p className="-mt-3 mb-3 inline-flex items-center gap-1.5 text-[13px] text-muted">
            <ArrowLeft {...ICON_SM} /> Back to decisions
          </p>
          <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-[minmax(0,1fr)] gap-4">
            <AppCard data-ap-doc title="Document" className="col-span-4 h-full overflow-hidden">
              <InvoiceDoc highlights={["lines", "trn", "vat", "total"]} compact className="shadow-none!" />
            </AppCard>
            <RecordCard />
            <ActionsAndHistory />
          </div>
        </div>
        <div className="pointer-events-none absolute bottom-6 left-[88px]">
          <div data-ap-toast className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-[13px] text-white shadow-lift">
            <CircleCheck {...ICON} className="text-ok-soft" />
            Approved and recorded with its evidence. Saved as a precedent.
          </div>
        </div>
      </div>
      <div data-ap-cursor aria-hidden className="pointer-events-none absolute left-0 top-0 z-20" style={{ opacity: 0 }}>
        <CursorPointer />
      </div>
    </Stage>
  );
}

const HOLD_MS = 1100;

const reasons = [{ id: "why", title: "Why this", body: explanation }, ...evidence.map((e) => ({ id: e.id, title: e.title, body: e.body }))];

/**
 * Phones: "Hold to approve", on the app's Decision record and Actions cards. The evidence sits in pills you can open.
 * Press and hold the ink button until it fills to approve. The first time the card is on screen it shows the gesture
 * once, then hands it over.
 */
function MobileScene() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState("why");
  const [approved, setApproved] = useState(false);
  const [hint, setHint] = useState<"idle" | "demo" | "your-turn">("idle");
  const raf = useRef(0);
  const holding = useRef(false);
  const progress = useRef(0);
  const touched = useRef(false);

  const paint = useCallback((p: number) => {
    progress.current = p;
    btnRef.current?.style.setProperty("--p", p.toFixed(4));
  }, []);

  const complete = useCallback(() => {
    holding.current = false;
    paint(1);
    setApproved(true);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(12);
  }, [paint]);

  // Fill while held; drain back if released early
  const run = useCallback(
    (direction: 1 | -1, durationMs: number, onDone?: () => void) => {
      cancelAnimationFrame(raf.current);
      let last = performance.now();
      const step = (now: number) => {
        const dt = now - last;
        last = now;
        const next = Math.min(1, Math.max(0, progress.current + (direction * dt) / durationMs));
        paint(next);
        if (direction === 1 && next >= 1) return onDone?.();
        if (direction === -1 && next <= 0) return;
        raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    },
    [paint],
  );

  const start = () => {
    if (approved) return;
    touched.current = true;
    holding.current = true;
    setHint("idle");
    run(1, HOLD_MS, complete);
  };
  const stop = () => {
    if (!holding.current) return;
    holding.current = false;
    if (progress.current < 1) run(-1, 350);
  };
  const reset = () => {
    cancelAnimationFrame(raf.current);
    paint(0);
    setApproved(false);
  };

  // Show the gesture once, the first time the card is properly on screen
  useEffect(() => {
    const card = cardRef.current;
    if (!card || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timers: number[] = [];
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || touched.current) return;
        io.disconnect();
        setHint("demo");
        timers.push(
          window.setTimeout(() => {
            if (touched.current) return;
            run(1, 1300, () => {
              setApproved(true);
              timers.push(
                window.setTimeout(() => {
                  if (touched.current) return;
                  paint(0);
                  setApproved(false);
                  setHint("your-turn");
                }, 1800),
              );
            });
          }, 700),
        );
      },
      { threshold: 0.7 },
    );
    io.observe(card);
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
      timers = [];
      cancelAnimationFrame(raf.current);
    };
  }, [run, paint]);

  const current = reasons.find((r) => r.id === open) ?? reasons[0];

  return (
    <div data-mobile className="container-x mt-10 max-w-xl font-app lg:hidden">
      <div ref={cardRef} data-reveal className="flex flex-col gap-3">
        <AppCard
          title="Decision record"
          action={
            <Chip size="sm" tone={approved ? "done" : "review"}>
              <span aria-live="polite">{approved ? "Approved" : "Needs review"}</span>
            </Chip>
          }
        >
          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-semibold text-muted">Issue</p>
            <p className="text-[14px] font-semibold leading-[20px]">{ISSUE}</p>
            <p className="text-[13px] text-muted">{client.name}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-semibold text-muted">Proposal</p>
            <Fields
              rows={[
                ["Account", `${costLine.code} · ${costLine.account}`],
                ["VAT", `Standard rated 5% · ${aed(vatLine.debit)}`],
                ["Payable", `AED ${aed(payableLine.credit)}`],
              ]}
            />
          </div>
          <span className="flex items-center gap-2">
            <ConfidenceBar value={0.94} />
            <span className="text-[13px] text-muted">High confidence</span>
          </span>
          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-semibold text-muted">Evidence</p>
            <div className="flex flex-wrap gap-1.5">
              {reasons.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={open === r.id}
                  onClick={() => setOpen(r.id)}
                  className={`min-h-9 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                    open === r.id ? "bg-ink text-white" : "bg-line-soft text-muted"
                  }`}
                >
                  {r.title}
                </button>
              ))}
            </div>
            <p key={current.id} className="anim-rise rounded-app-tile bg-line-soft p-3.5 text-[14px] leading-[20px]" aria-live="polite">
              {current.body}
            </p>
          </div>
        </AppCard>

        <AppCard title="Actions">
          <button
            ref={btnRef}
            type="button"
            disabled={approved}
            onPointerDown={(e) => {
              start();
              // Keep receiving the release even if the finger drifts off the button
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                /* not an active pointer: the hold still works without capture */
              }
            }}
            onPointerUp={stop}
            onPointerCancel={stop}
            onLostPointerCapture={stop}
            onKeyDown={(e) => {
              if ((e.key === " " || e.key === "Enter") && !e.repeat) {
                e.preventDefault();
                start();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === " " || e.key === "Enter") stop();
            }}
            onContextMenu={(e) => e.preventDefault()}
            aria-label={approved ? "Approved" : "Press and hold to approve"}
            className="relative flex h-14 w-full touch-manipulation select-none items-center justify-center gap-3 overflow-hidden rounded-full bg-ink text-[15px] font-semibold text-white [-webkit-touch-callout:none] disabled:bg-ok"
            style={{ "--p": 0 } as React.CSSProperties}
          >
            <span aria-hidden className="absolute inset-0 origin-left bg-accent transition-opacity" style={{ transform: "scaleX(var(--p))", opacity: approved ? 0 : 1 }} />
            {approved ? (
              <Check size={20} strokeWidth={2.6} className="relative" />
            ) : (
              <svg aria-hidden viewBox="0 0 24 24" className="relative h-6 w-6 -rotate-90">
                <circle cx="12" cy="12" r="9.5" fill="none" stroke="rgb(255 255 255 / 0.25)" strokeWidth="2.5" />
                <circle
                  cx="12"
                  cy="12"
                  r="9.5"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray="1"
                  style={{ strokeDashoffset: "calc(1 - var(--p))" }}
                />
              </svg>
            )}
            <span className="relative">{approved ? "Approved" : "Press and hold to approve"}</span>
            {hint === "demo" && !approved && (
              <span aria-hidden className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-white/30" />
            )}
          </button>
          <div className="flex min-h-6 items-center justify-between gap-3 text-[13px] text-muted">
            <span>
              {approved
                ? "Approved by you · Recorded with its evidence"
                : hint === "your-turn"
                  ? "Your turn. Press and hold the button."
                  : NOT_WRITTEN}
            </span>
            {approved && (
              <button type="button" onClick={reset} className="min-h-9 shrink-0 px-1 font-semibold text-ink underline underline-offset-2">
                Reset
              </button>
            )}
          </div>
        </AppCard>
      </div>
    </div>
  );
}

export default function ApprovalWorkflow() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      const mm = approvalAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="review" aria-labelledby="review-title" className="relative py-24 sm:py-28 lg:flex lg:h-svh lg:flex-col lg:pb-5 lg:pt-20">
      <SectionHeading
        id="review-title"
        eyebrow="Review"
        title={
          <>
            <Brand /> prepares.
            <br className="hidden sm:block lg:hidden" /> Your team approves.
          </>
        }
        className="container-x"
        pinned
      >
        Every decision comes with its record: the evidence, the rule, your firm&apos;s policy and its precedents.
      </SectionHeading>
      <div data-desktop className="container-x mt-6 hidden min-h-0 flex-1 lg:block">
        <DesktopScene />
      </div>
      <MobileScene />
    </section>
  );
}
