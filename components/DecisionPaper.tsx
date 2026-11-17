"use client";

import { useRef, type ReactNode } from "react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import Stage from "./Stage";
import { IconCheck } from "./icons";
import { decisionAnimation, useGSAP } from "@/lib/animations";
import { aed, client, formatTrn, invoice, precedentBills, preparedEntry } from "@/lib/demo-data";

/*
 * "How it decides": the decision behind INV-2026-0418, written up the way an
 * accountant writes up a working paper. Every line carries a tick mark that says
 * where it came from. Black ticks are checks done by code (arithmetic, agreeing
 * to the document); blue ticks are judgement calls (rule, policy, precedent).
 * Markup is the finished paper; the timeline writes it in.
 */

type TickKind = "sum" | "agreed" | "rule" | "policy" | "precedent";
type TickSource = "code" | "judgement";

const TICKS: Record<TickKind, { mark: ReactNode; by: TickSource; label: string }> = {
  sum: {
    mark: (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 15.5l6-7 6 7" />
      </svg>
    ),
    by: "code",
    label: "Added up and balanced",
  },
  agreed: { mark: <IconCheck size={11} strokeWidth={2.8} />, by: "code", label: "Agreed to the invoice" },
  rule: { mark: "R", by: "judgement", label: "UAE rule, with its date" },
  policy: { mark: "F", by: "judgement", label: "Your firm's policy" },
  precedent: { mark: "P", by: "judgement", label: "Your team's earlier decisions" },
};

const [costLine, vatLine, payableLine] = preparedEntry.lines;

const ROWS: { label: string; body: ReactNode; tick?: TickKind; note?: string }[] = [
  { label: "Issue", body: <>Supplier bill from {invoice.supplier}</> },
  {
    label: "Evidence",
    body: (
      <>
        Tax invoice <span className="tnum">{invoice.number}</span>, TRN <span className="tnum">{formatTrn(invoice.supplierTrn)}</span>, {invoice.lines.length} lines
      </>
    ),
    tick: "agreed",
  },
  {
    label: "Figures",
    body: (
      <span className="tnum">
        {aed(invoice.net)} + VAT {aed(invoice.vat)} = AED {aed(invoice.total)}
      </span>
    ),
    tick: "sum",
  },
  { label: "UAE rule", body: <>Standard rate 5%. Input VAT recoverable on a valid tax invoice.</>, tick: "rule", note: "Rules as of Nov 2026" },
  { label: "Firm policy", body: <>Office consumables are coded to {costLine.code} {costLine.account}.</>, tick: "policy" },
  { label: "Precedent", body: <>Your team coded the last {precedentBills} bills from this supplier to {costLine.code}.</>, tick: "precedent" },
  {
    label: "Proposal",
    body: (
      <span className="tnum">
        Dr {costLine.code} {aed(costLine.debit)} · Dr {vatLine.code} {aed(vatLine.debit)} · Cr {payableLine.code} {aed(payableLine.credit)}
      </span>
    ),
    tick: "sum",
  },
  { label: "Confidence", body: <>High. Known supplier, low value, nothing missing.</> },
  { label: "Action", body: <>Prepared for your team&apos;s review. Reversible.</> },
];

/** Resting tilt of a tick mark, like a pen mark. writePaper() in lib/animations.ts lands on the same angle. */
const TICK_TILT = -6;

function Tick({ kind, plain = false }: { kind: TickKind; plain?: boolean }) {
  const t = TICKS[kind];
  const code = t.by === "code";
  return (
    <span
      data-tick={plain ? undefined : kind}
      className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-[1.5px] font-mono text-[11px] font-bold leading-none ${
        code ? "border-ink bg-paper text-ink" : "border-accent bg-accent-soft text-accent-ink"
      }`}
      style={{ transform: `rotate(${TICK_TILT}deg)` }}
    >
      <span aria-hidden>{t.mark}</span>
      {!plain && <span className="sr-only">{t.label}</span>}
    </span>
  );
}

function Paper({ compact = false }: { compact?: boolean }) {
  return (
    <div data-paper className={`card relative overflow-hidden ${compact ? "" : "w-[760px] shrink-0 shadow-lift"}`}>
      <div className="flex items-start justify-between gap-4 border-b border-line px-4 py-3.5 sm:px-5">
        <div className="min-w-0 leading-tight">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-faint">Working paper</p>
          <p className="tnum mt-1 text-[14px] font-semibold">Bill {invoice.number}</p>
          <p className={`text-[11.5px] text-muted ${compact ? "" : "truncate"}`}>{client.name} · November 2026</p>
        </div>
        <div className="shrink-0 text-right text-[11.5px] leading-snug">
          <p className="text-muted">
            Prepared by <Brand className="font-medium text-ink" />
          </p>
          <p className="tnum text-faint">{preparedEntry.preparedAt}</p>
        </div>
      </div>

      <div className="relative">
        {!compact && <span aria-hidden className="absolute inset-y-0 left-[116px] w-px bg-accent/15" />}
        {ROWS.map((r) => (
          <div
            key={r.label}
            data-paper-row
            className={`grid items-center gap-x-3 border-b border-line-soft last:border-0 ${
              compact ? "grid-cols-[1fr_24px] px-4 py-2.5" : "min-h-[40px] grid-cols-[84px_1fr_26px] gap-x-5 px-5 py-[9px]"
            }`}
          >
            <span data-paper-label className={`text-[11.5px] font-medium text-muted ${compact ? "col-start-1 row-start-1" : ""}`}>
              {r.label}
            </span>
            <span className={`relative block min-w-0 leading-snug ${compact ? "col-start-1 row-start-2 mt-0.5 text-[13px]" : "text-[12.5px]"}`}>
              {r.body}
              {r.note && <span className={`pill pill-neutral text-[10.5px]! ${compact ? "mt-1.5 flex w-fit" : "ml-2"}`}>{r.note}</span>}
              <span data-paper-cover aria-hidden className="absolute -inset-y-0.5 -right-1 left-0 origin-right bg-paper" style={{ transform: "scaleX(0)" }} />
            </span>
            <span className={`grid place-items-center ${compact ? "col-start-2 row-span-2 row-start-1" : ""}`}>{r.tick && <Tick kind={r.tick} />}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 border-t border-line bg-canvas/50 px-4 py-3 sm:px-5">
        <p className="text-[11.5px] text-muted">Every line can be traced and reversed.</p>
        <div data-paper-signoff className="flex items-center gap-2.5">
          <span className="text-[11.5px] text-muted">Reviewed by</span>
          <span className="grid h-8 w-40 place-items-center rounded-md border border-dashed border-accent/60 bg-accent-soft/50 text-[11px] font-medium text-accent-ink">
            Your team signs here
          </span>
        </div>
      </div>
    </div>
  );
}

const sources: { by: TickSource; title: ReactNode }[] = [
  { by: "code", title: "Checked by code" },
  {
    by: "judgement",
    title: (
      <>
        Judged by <Brand />
      </>
    ),
  },
];
const kindsBy = (by: TickSource) => (Object.keys(TICKS) as TickKind[]).filter((k) => TICKS[k].by === by);
const ruleNote = "A judgement can never change a figure. If a code check fails, the item is held for your team.";

/** Desktop: the key beside the paper. Each entry lights up the first time its tick lands. */
function Legend() {
  return (
    <div data-legend className="card w-[380px] shrink-0 p-5">
      <p className="text-[14px] font-semibold tracking-[-0.01em]">Tick marks</p>
      <p className="mt-1 text-[12px] text-muted">Where each line on the paper came from.</p>
      {sources.map((s) => (
        <div key={s.by} className="mt-4">
          <p className="text-[11.5px] font-medium text-muted">{s.title}</p>
          <ul className="mt-1.5 space-y-0.5">
            {kindsBy(s.by).map((k) => (
              <li key={k} data-legend-item={k} className="relative flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-[12.5px]">
                <span data-legend-flash aria-hidden className="absolute inset-0 rounded-lg bg-accent-soft" style={{ opacity: 0 }} />
                <span className="relative">
                  <Tick kind={k} plain />
                </span>
                <span className="relative">{TICKS[k].label}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="mt-4 border-t border-line pt-4 text-[12px] leading-relaxed text-muted">{ruleNote}</p>
    </div>
  );
}

function DesktopScene() {
  return (
    <Stage
      width={1200}
      height={600}
      label={`A working paper for bill ${invoice.number}. Each line is written in with a tick mark showing its source. The figures ${aed(invoice.net)} plus VAT ${aed(invoice.vat)} equal ${aed(invoice.total)} and the proposed entry balances, both checked by code. The UAE VAT rule, the firm's policy and ${precedentBills} earlier decisions support coding it to ${costLine.code} ${costLine.account}. It is prepared for review, and the Reviewed by box is left for the team.`}
    >
      <div className="absolute inset-0 flex items-center justify-center gap-[60px]">
        <Paper />
        <Legend />
      </div>
    </Stage>
  );
}

/** Phones: a compact key first, then the paper writes itself in as it scrolls through. */
function MobileScene() {
  return (
    <div data-mobile className="container-x mt-10 max-w-xl lg:hidden">
      <div data-reveal className="card space-y-2.5 px-4 py-3.5 text-[12.5px]">
        {sources.map((s) => (
          <div key={s.by}>
            <p className="text-[11.5px] font-medium text-muted">{s.title}</p>
            <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1.5">
              {kindsBy(s.by).map((k) => (
                <li key={k} className="flex items-center gap-1.5">
                  <Tick kind={k} plain />
                  {TICKS[k].label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Paper compact />
      </div>
      <p className="mt-4 px-1 text-[13px] leading-relaxed text-muted">{ruleNote}</p>
    </div>
  );
}

export default function DecisionPaper() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      const mm = decisionAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="decides" aria-labelledby="decides-title" className="relative py-24 sm:py-28 lg:flex lg:h-svh lg:flex-col lg:pb-5 lg:pt-20">
      <SectionHeading id="decides-title" eyebrow="How it decides" title="It shows its working." className="container-x" pinned>
        Code checks every figure. <Brand className="font-medium text-ink" /> makes the judgement calls and writes each one up with its evidence.
      </SectionHeading>
      <div data-desktop className="container-x mt-6 hidden min-h-0 flex-1 lg:block">
        <DesktopScene />
      </div>
      <MobileScene />
    </section>
  );
}
