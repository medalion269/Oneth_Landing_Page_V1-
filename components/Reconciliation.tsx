"use client";

import { useRef } from "react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import Stage from "./Stage";
import { IconAlert, IconBank, IconCheck, IconDoc, IconLink, IconMessage } from "./icons";
import { reconciliationAnimation, useGSAP } from "@/lib/animations";
import { aed, bankTransactions, client, openItems, reviewItems, type MatchState } from "@/lib/demo-data";

const ROW = "h-[52px]";

/** Match lines: four confident matches, two candidates for the same payment. */
const LINES = [
  ...openItems.slice(0, 4).map((d) => ({ from: d.matches, to: d.id, kind: "match" as const })),
  { from: "b5", to: "d5", kind: "candidate" as const },
  { from: "b5", to: "d6", kind: "candidate" as const },
];

function MatchIndicator({ id, state, align = "end" }: { id: string; state: MatchState; align?: "start" | "end" }) {
  const cls = align === "end" ? "justify-self-end" : "justify-self-start";
  if (state === "matched") {
    return (
      <span data-ind={id} className={`grid h-5 w-5 place-items-center rounded-full bg-accent text-white ${cls}`}>
        <IconCheck size={12} strokeWidth={2.4} />
      </span>
    );
  }
  if (state === "review") {
    return (
      <span data-ind={id} className={`pill pill-warn text-[10.5px]! ${cls}`}>
        2 possible bills
      </span>
    );
  }
  return (
    <span data-ind={id} className={`pill pill-warn text-[10.5px]! ${cls}`}>
      No receipt
    </span>
  );
}

function Tint({ id, tone }: { id: string; tone: "accent" | "warn" }) {
  return (
    <span
      data-tint={id}
      aria-hidden
      className={`absolute inset-0 ${tone === "warn" ? "bg-[#fef3c7]/55" : "bg-accent/[0.045]"}`}
    />
  );
}

function BankTable() {
  return (
    <div data-bank-table className="card absolute left-0 top-0 w-[500px] overflow-hidden text-[12px]">
      <div className="flex items-center gap-2.5 px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-canvas text-ink">
          <IconBank size={16} />
        </span>
        <div className="leading-tight">
          <p className="text-[13px] font-semibold">Bank transactions</p>
          <p className="text-[11px] text-muted">Business account ending {client.account} · November 2026</p>
        </div>
      </div>
      <div className="grid grid-cols-[46px_1fr_84px_104px] gap-3 border-y border-line bg-canvas/60 px-4 py-1.5 text-[11px] text-muted">
        <span>Date</span>
        <span>Description</span>
        <span className="text-right">AED</span>
        <span className="text-right">Status</span>
      </div>
      {bankTransactions.map((t) => (
        <div key={t.id} data-bank-row={t.id} className={`relative grid ${ROW} grid-cols-[46px_1fr_84px_104px] items-center gap-3 border-b border-line-soft px-4 last:border-0`}>
          <Tint id={t.id} tone={t.state === "matched" ? "accent" : "warn"} />
          <span className="tnum relative text-muted">{t.date}</span>
          <span className="relative truncate font-mono text-[11px]">{t.description}</span>
          <span className={`tnum relative text-right font-medium ${t.amount > 0 ? "text-ok" : ""}`}>{aed(t.amount)}</span>
          <span className="relative grid">
            <MatchIndicator id={t.id} state={t.state} />
          </span>
        </div>
      ))}
    </div>
  );
}

function DocTable() {
  return (
    <div data-doc-table className="card absolute top-0 w-[500px] overflow-hidden text-[12px]" style={{ left: 700 }}>
      <div className="flex items-center gap-2.5 px-4 py-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-canvas text-ink">
          <IconDoc size={16} />
        </span>
        <div className="leading-tight">
          <p className="text-[13px] font-semibold">Invoices and bills</p>
          <p className="text-[11px] text-muted">Open items · {client.name}</p>
        </div>
      </div>
      <div className="grid grid-cols-[22px_1fr_82px_84px] gap-3 border-y border-line bg-canvas/60 px-4 py-1.5 text-[11px] text-muted">
        <span />
        <span>Document</span>
        <span>Type</span>
        <span className="text-right">AED</span>
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
              className={`relative grid ${ROW} grid-cols-[22px_1fr_82px_84px] items-center gap-3 border-b border-line-soft bg-paper px-4 last:border-0`}
            >
              <Tint id={d.id} tone={state === "matched" ? "accent" : "warn"} />
              <span className="relative grid">
                {state === "matched" ? (
                  <MatchIndicator id={d.id} state="matched" align="start" />
                ) : (
                  <span data-ind={d.id} className="grid h-5 w-5 place-items-center rounded-full bg-[#fde68a] text-[11px] font-bold text-warn">
                    ?
                  </span>
                )}
              </span>
              <span className="relative min-w-0 leading-tight">
                <span className="tnum block truncate font-medium">{d.ref}</span>
                <span className="block truncate text-[11px] text-muted">{d.party}</span>
              </span>
              <span className="relative text-muted">{d.kind}</span>
              <span className="tnum relative text-right font-medium">{aed(d.amount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewPanel({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div data-review-panel className={`rounded-2xl border border-line bg-paper text-[12.5px] shadow-float ${className}`} style={style}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-5 py-3">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-warn-soft text-warn">
          <IconAlert size={14} />
        </span>
        <p className="font-semibold">Needs your review</p>
        <span className="pill pill-neutral">2 items</span>
        <p className="w-full text-[12px] text-muted sm:ml-auto sm:w-auto sm:text-[11.5px]">4 of 6 transactions matched. Nothing is posted until you approve.</p>
      </div>
      {reviewItems.map((r, i) => (
        <div key={r.id} data-review-item className={`flex items-start gap-3 px-4 py-3.5 sm:items-center sm:px-5 sm:py-3 ${i ? "border-t border-line-soft" : ""}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-canvas text-muted">
            {r.tone === "review" ? <IconLink size={15} /> : <IconMessage size={15} />}
          </span>
          <div className="min-w-0 flex-1 leading-snug">
            <p className="font-medium">{r.title}</p>
            <p className="mt-0.5 text-[12.5px] text-muted sm:mt-0 sm:text-[11.5px]">{r.detail}</p>
            <span className="mt-2.5 inline-flex rounded-lg border border-line px-3 py-2 text-[12.5px] font-medium sm:hidden">{r.action}</span>
          </div>
          <span className="hidden shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-[11.5px] font-medium sm:inline-flex">{r.action}</span>
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
      label="Six bank transactions are matched against open invoices and bills. Four match exactly. One payment has two possible bills and one card payment has no receipt, so both go to a review panel for the accountant."
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
              <path
                data-recon-line
                data-from={l.from}
                data-to={l.to}
                data-kind={l.kind}
                fill="none"
                stroke="#D97706"
                strokeWidth={1.25}
                strokeOpacity={0.75}
                strokeDasharray="4 4"
              />
            )}
            <circle data-line-end={`${l.from}-${l.to}`} r={3} fill={l.kind === "match" ? "#033FFE" : "#D97706"} />
            <circle data-line-end={`${l.from}-${l.to}`} r={3} fill={l.kind === "match" ? "#033FFE" : "#D97706"} />
          </g>
        ))}
      </svg>
      <ReviewPanel className="absolute w-[740px]" style={{ left: 230, top: 418 }} />
    </Stage>
  );
}

/** Unreconciled = the absolute value of bank lines not yet matched. Derived, never typed. */
const totalBank = bankTransactions.reduce((s, t) => s + Math.abs(t.amount), 0);
const zipMatched = bankTransactions.filter((t) => t.state === "matched");
const zipExceptions = bankTransactions.filter((t) => t.state !== "matched");
const unreconciledAfter = zipExceptions.reduce((s, t) => s + Math.abs(t.amount), 0);

/**
 * Phones: "Zip the books". As the section scrolls through, each bank line
 * slides in from the left and its invoice from the right; they zip into one
 * matched row while the unreconciled amount counts down. The two lines that
 * do not fit drop into a small "Needs you" tray. Markup is the finished state.
 */
function MobileScene() {
  return (
    <div data-mobile data-zip data-total={totalBank} data-final={unreconciledAfter} className="container-x mt-10 max-w-xl lg:hidden">
      <div className="card p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[12.5px] text-muted">Unreconciled</p>
          <p className="text-[12px] text-muted">Account ending {client.account}</p>
        </div>
        <p className="tnum mt-0.5 text-[28px] font-semibold tracking-[-0.03em]">
          AED <span data-zip-amount>{aed(unreconciledAfter)}</span>
        </p>
        <p className="tnum text-[12.5px] text-muted">
          of AED {aed(totalBank)} on {bankTransactions.length} bank lines in November
        </p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-soft">
          <span
            data-zip-bar
            className="block h-full origin-left rounded-full bg-accent"
            style={{ transform: `scaleX(${((totalBank - unreconciledAfter) / totalBank).toFixed(4)})` }}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-between px-1 text-[11px] font-medium uppercase tracking-[0.06em] text-faint">
        <span>Bank</span>
        <span>Invoices and bills</span>
      </div>
      <div data-zip-rows className="mt-2 space-y-2">
        {zipMatched.map((t) => {
          const d = openItems.find((o) => o.matches === t.id)!;
          return (
            <div
              key={t.id}
              data-zip-row
              data-amount={Math.abs(t.amount)}
              className="relative grid grid-cols-2 overflow-hidden rounded-xl border border-line bg-paper text-[12px] leading-snug shadow-soft"
            >
              <div data-zip-left className="min-w-0 py-2.5 pl-3 pr-5">
                <p className="truncate font-mono text-[10.5px] text-muted">
                  {t.date} · {t.description}
                </p>
                <p className={`tnum mt-0.5 font-semibold ${t.amount > 0 ? "text-ok" : ""}`}>{aed(t.amount)}</p>
              </div>
              <div data-zip-right className="min-w-0 border-l border-dashed border-line py-2.5 pl-5 pr-3">
                <p className="tnum truncate font-semibold">{d.ref}</p>
                <p className="truncate text-[11px] text-muted">{d.party}</p>
              </div>
              <span
                data-zip-check
                className="absolute left-1/2 top-1/2 grid h-6 w-6 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-accent text-white ring-4 ring-paper"
              >
                <IconCheck size={12} strokeWidth={2.6} />
              </span>
            </div>
          );
        })}
      </div>

      <div data-zip-tray className="mt-4 rounded-2xl border border-[#fcd34d] bg-warn-soft/40 p-3.5 text-[12.5px]">
        <p className="flex items-center gap-2 font-semibold">
          <span className="grid h-5 w-5 place-items-center rounded-full bg-warn-soft text-warn">
            <IconAlert size={12} />
          </span>
          Needs you · {zipExceptions.length}
        </p>
        {zipExceptions.map((t) => (
          <div key={t.id} data-zip-exception className="mt-2.5 flex items-start justify-between gap-3 rounded-xl bg-paper px-3 py-2.5">
            <div className="min-w-0">
              <p className="truncate font-mono text-[10.5px] text-muted">{t.description}</p>
              <p className="mt-0.5">
                {t.state === "review" ? "Two open bills match this amount." : `No receipt yet. A request to ${client.contact} is drafted.`}
              </p>
            </div>
            <span className="tnum shrink-0 font-semibold">{aed(t.amount)}</span>
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
    <section ref={root} id="reconciliation" aria-labelledby="recon-title" className="relative py-24 sm:py-28 lg:flex lg:h-svh lg:flex-col lg:pb-5 lg:pt-20">
      <SectionHeading id="recon-title" eyebrow="Reconcile" title="Less matching. More reviewing." className="container-x" pinned>
        <Brand className="font-medium text-ink" /> matches transactions with invoices and bills. Your accountants review what needs attention.
      </SectionHeading>
      <div data-desktop className="container-x mt-6 hidden min-h-0 flex-1 lg:block">
        <DesktopScene />
      </div>
      <MobileScene />
    </section>
  );
}
