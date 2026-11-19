"use client";

import { useRef } from "react";
import { Check, CircleAlert, FileQuestion, Link2 } from "lucide-react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import Stage from "./Stage";
import { Chip, ICON_SM, IconCircle, PillButton } from "./app/ui";
import { reconciliationAnimation, useGSAP } from "@/lib/animations";
import { aed, bankTransactions, client, openItems, reviewItems, type MatchState } from "@/lib/demo-data";

/*
 * Reconcile: the oneth app's Bank reconciliation (frontend/src/app/clients/PeriodTabs.tsx): the month's bank lines and
 * ledger items as two cards, oneth's matches between them, and what it can't explain going to a person.
 */

const ROW = "h-[46px]";
const NOT_WRITTEN = "oneth only proposes. Nothing is written to your books.";

/** Match lines: four confident matches, two candidates for the same payment. */
const LINES = [
  ...openItems.slice(0, 4).map((d) => ({ from: d.matches, to: d.id, kind: "match" as const })),
  { from: "b5", to: "d5", kind: "candidate" as const },
  { from: "b5", to: "d6", kind: "candidate" as const },
];

/** The Match column, as the app's chips. */
function MatchIndicator({ id, state, align = "end" }: { id: string; state: MatchState; align?: "start" | "end" }) {
  const cls = `inline-flex ${align === "end" ? "justify-self-end" : "justify-self-start"}`;
  if (state === "matched") {
    return (
      <span data-ind={id} className={cls}>
        <Chip size="sm" tone="accent">
          <Check size={12} strokeWidth={2.4} /> Matched
        </Chip>
      </span>
    );
  }
  return (
    <span data-ind={id} className={cls}>
      <Chip size="sm" tone="review">
        {state === "review" ? "2 possible bills" : "No receipt"}
      </Chip>
    </span>
  );
}

function Tint({ id, tone }: { id: string; tone: "accent" | "warn" }) {
  return <span data-tint={id} aria-hidden className={`absolute inset-0 ${tone === "warn" ? "bg-warn-soft/55" : "bg-accent/[0.045]"}`} />;
}

/** The app's card around a plain table: title and chip on top, a grey 13px header, hairline rows. */
function TableCard({
  title,
  chip,
  hook,
  left,
  children,
}: {
  title: string;
  chip?: React.ReactNode;
  hook: "bank" | "doc";
  left: number;
  children: React.ReactNode;
}) {
  return (
    <div
      {...(hook === "bank" ? { "data-bank-table": "" } : { "data-doc-table": "" })}
      className="absolute top-0 w-[500px] overflow-hidden rounded-app-card bg-paper font-app text-[13px] text-ink shadow-lift antialiased"
      style={{ left }}
    >
      <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-5">
        <p className="text-[15px] font-semibold leading-[22px]">{title}</p>
        {chip}
      </div>
      {children}
    </div>
  );
}

function BankTable() {
  return (
    <TableCard
      title="Bank lines"
      hook="bank"
      left={0}
      chip={
        <Chip size="sm" tone="neutral">
          Account ending {client.account} · Nov 2026
        </Chip>
      }
    >
      <div className="grid h-9 grid-cols-[46px_1fr_84px_112px] items-center gap-3 border-b border-line px-5 text-[13px] text-muted">
        <span>Date</span>
        <span>Description</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Match</span>
      </div>
      {bankTransactions.map((t) => (
        <div key={t.id} data-bank-row={t.id} className={`relative grid ${ROW} grid-cols-[46px_1fr_84px_112px] items-center gap-3 border-b border-line-soft px-5 last:border-0`}>
          <Tint id={t.id} tone={t.state === "matched" ? "accent" : "warn"} />
          <span className="relative text-muted tabular-nums">{t.date}</span>
          <span className="relative truncate font-mono text-[12px]">{t.description}</span>
          <span className={`relative text-right font-semibold tabular-nums ${t.amount > 0 ? "text-ok" : ""}`}>{aed(t.amount)}</span>
          <span className="relative grid">
            <MatchIndicator id={t.id} state={t.state} />
          </span>
        </div>
      ))}
    </TableCard>
  );
}

function DocTable() {
  return (
    <TableCard title="Ledger items" hook="doc" left={700}>
      <div className="grid h-9 grid-cols-[22px_1fr_86px_84px] items-center gap-3 border-b border-line px-5 text-[13px] text-muted">
        <span />
        <span>Document</span>
        <span>Type</span>
        <span className="text-right">Amount</span>
      </div>
      <div className="relative">
        {openItems.map((d, idx) => {
          const state: MatchState = d.matches === "b5" ? "review" : "matched";
          return (
            <div
              key={d.id}
              data-doc-row={d.id}
              data-idx={idx}
              data-shuffle={d.shuffledIndex}
              className={`relative grid ${ROW} grid-cols-[22px_1fr_86px_84px] items-center gap-3 border-b border-line-soft bg-paper px-5 last:border-0`}
            >
              <Tint id={d.id} tone={state === "matched" ? "accent" : "warn"} />
              <span className="relative grid">
                <span
                  data-ind={d.id}
                  className={`grid h-5 w-5 place-items-center rounded-full text-[11px] font-semibold ${state === "matched" ? "bg-accent text-white" : "bg-warn-soft text-warn"}`}
                >
                  {state === "matched" ? <Check size={12} strokeWidth={2.6} /> : "?"}
                </span>
              </span>
              <span className="relative min-w-0 leading-tight">
                <span className="block truncate font-semibold tabular-nums">{d.ref}</span>
                <span className="block truncate text-[12px] text-muted">{d.party}</span>
              </span>
              <span className="relative text-muted">{d.kind}</span>
              <span className="relative text-right font-semibold tabular-nums">{aed(d.amount)}</span>
            </div>
          );
        })}
      </div>
    </TableCard>
  );
}

/** What oneth can't settle goes to a person: the app's list rows with an action on the right. */
function ReviewPanel({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div data-review-panel className={`flex flex-col gap-3 rounded-app-card bg-paper p-5 font-app text-ink shadow-float antialiased ${className}`} style={style}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-[15px] font-semibold leading-[22px]">Needs your review</p>
        <Chip size="sm" tone="review">
          2 items
        </Chip>
        <p className="w-full text-[13px] text-muted sm:ml-auto sm:w-auto">4 of 6 bank lines matched. {NOT_WRITTEN}</p>
      </div>
      {reviewItems.map((r) => (
        <div key={r.id} data-review-item className="flex items-start gap-3 rounded-app-tile bg-line-soft px-4 py-3 sm:items-center">
          <IconCircle icon={r.tone === "review" ? Link2 : FileQuestion} tone="card" />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold leading-[20px]">{r.title}</p>
            <p className="text-[13px] leading-[18px] text-muted">{r.detail}</p>
          </div>
          <PillButton size="sm" variant="primary" className="hidden sm:inline-flex">
            {r.action}
          </PillButton>
        </div>
      ))}
    </div>
  );
}

function DesktopScene() {
  return (
    <Stage
      width={1200}
      height={600}
      label="The oneth app's bank reconciliation: six bank lines and six ledger items. Four bank lines match exactly. One payment has two possible bills and one card payment has no receipt, so both go to a person to review."
    >
      <BankTable />
      <DocTable />
      <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width={1200} height={600} viewBox="0 0 1200 600">
        {LINES.map((l) => (
          <g key={`${l.from}-${l.to}`}>
            {l.kind === "match" ? (
              <path
                data-recon-line
                data-from={l.from}
                data-to={l.to}
                data-kind={l.kind}
                pathLength={1}
                fill="none"
                stroke="#033FFE"
                strokeWidth={1.25}
                strokeOpacity={0.7}
                strokeDasharray="1"
                strokeDashoffset={0}
              />
            ) : (
              <path data-recon-line data-from={l.from} data-to={l.to} data-kind={l.kind} fill="none" stroke="#B45309" strokeWidth={1.25} strokeOpacity={0.75} strokeDasharray="4 4" />
            )}
            <circle data-line-end={`${l.from}-${l.to}`} r={3} fill={l.kind === "match" ? "#033FFE" : "#B45309"} />
            <circle data-line-end={`${l.from}-${l.to}`} r={3} fill={l.kind === "match" ? "#033FFE" : "#B45309"} />
          </g>
        ))}
      </svg>
      <ReviewPanel className="absolute w-[760px]" style={{ left: 220, top: 404 }} />
    </Stage>
  );
}

/** Unreconciled = the absolute value of bank lines not yet matched. Derived, never typed. */
const totalBank = bankTransactions.reduce((s, t) => s + Math.abs(t.amount), 0);
const zipMatched = bankTransactions.filter((t) => t.state === "matched");
const zipExceptions = bankTransactions.filter((t) => t.state !== "matched");
const unreconciledAfter = zipExceptions.reduce((s, t) => s + Math.abs(t.amount), 0);

/**
 * Phones: "Zip the books". As the section scrolls through, each bank line slides in from the left and its ledger item
 * from the right; they zip into one matched row while the unreconciled amount counts down. The two lines that do not
 * fit drop into a small "Needs you" tray. Markup is the finished state. All in the app's cards and tiles.
 */
function MobileScene() {
  return (
    <div data-mobile data-zip data-total={totalBank} data-final={unreconciledAfter} className="container-x mt-10 max-w-xl font-app antialiased lg:hidden">
      <div className="rounded-app-card bg-paper p-5 shadow-app">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[13px] text-muted">Unreconciled</p>
          <p className="text-[12px] text-muted">Account ending {client.account}</p>
        </div>
        <p className="mt-0.5 text-[32px] font-semibold leading-[40px] tracking-[-0.015em] tabular-nums">
          AED <span data-zip-amount>{aed(unreconciledAfter)}</span>
        </p>
        <p className="text-[13px] text-muted tabular-nums">
          of AED {aed(totalBank)} on {bankTransactions.length} bank lines in November
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-accent-soft">
          <span
            data-zip-bar
            className="block h-full origin-left rounded-full bg-accent"
            style={{ transform: `scaleX(${((totalBank - unreconciledAfter) / totalBank).toFixed(4)})` }}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-between px-1 text-[12px] font-semibold text-muted">
        <span>Bank lines</span>
        <span>Ledger items</span>
      </div>
      <div data-zip-rows className="mt-2 space-y-2">
        {zipMatched.map((t) => {
          const d = openItems.find((o) => o.matches === t.id)!;
          return (
            <div
              key={t.id}
              data-zip-row
              data-amount={Math.abs(t.amount)}
              className="relative grid grid-cols-2 overflow-hidden rounded-app-tile bg-paper text-[13px] leading-snug shadow-app"
            >
              <div data-zip-left className="min-w-0 py-2.5 pl-3.5 pr-5">
                <p className="truncate font-mono text-[11px] text-muted">
                  {t.date} · {t.description}
                </p>
                <p className={`mt-0.5 font-semibold tabular-nums ${t.amount > 0 ? "text-ok" : ""}`}>{aed(t.amount)}</p>
              </div>
              <div data-zip-right className="min-w-0 border-l border-line-soft py-2.5 pl-5 pr-3.5">
                <p className="truncate font-semibold tabular-nums">{d.ref}</p>
                <p className="truncate text-[12px] text-muted">{d.party}</p>
              </div>
              <span
                data-zip-check
                className="absolute left-1/2 top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-white ring-4 ring-paper"
              >
                <Check size={12} strokeWidth={2.6} />
              </span>
            </div>
          );
        })}
      </div>

      <div data-zip-tray className="mt-4 flex flex-col gap-2 rounded-app-card bg-paper p-4 shadow-app">
        <p className="flex items-center gap-2 text-[15px] font-semibold">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-warn-soft text-warn">
            <CircleAlert {...ICON_SM} />
          </span>
          Needs you
          <Chip size="sm" tone="review">
            {zipExceptions.length}
          </Chip>
        </p>
        {zipExceptions.map((t) => (
          <div key={t.id} data-zip-exception className="flex items-start justify-between gap-3 rounded-app-tile bg-line-soft px-3.5 py-3 text-[13px]">
            <div className="min-w-0">
              <p className="truncate font-mono text-[11px] text-muted">{t.description}</p>
              <p className="mt-0.5">{t.state === "review" ? "Two open bills match this amount." : `No receipt yet. A request to ${client.contact} is drafted.`}</p>
            </div>
            <span className="shrink-0 font-semibold tabular-nums">{aed(t.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Reconciliation() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      const mm = reconciliationAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="reconciliation" aria-labelledby="recon-title" className="relative py-24 sm:py-28 lg:flex lg:h-svh lg:flex-col lg:pb-5 lg:pt-20 motion-mobile:pt-6">
      <SectionHeading id="recon-title" eyebrow="Reconcile" title="Less matching. More reviewing." className="container-x" pinned>
        <Brand className="font-medium text-ink" /> matches bank lines with invoices and bills. Your accountants review what needs attention.
      </SectionHeading>
      <div data-desktop className="container-x mt-6 hidden min-h-0 flex-1 lg:block">
        <DesktopScene />
      </div>
      <MobileScene />
    </section>
  );
}
