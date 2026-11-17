"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import Stage from "./Stage";
import { InvoiceDoc } from "./Documents";
import { CursorPointer, IconBank, IconCheck, IconDoc, IconFlag, IconPercent, IconUsers } from "./icons";
import { approvalAnimation, useGSAP } from "@/lib/animations";
import { aed, client, evidence, explanation, firm, invoice, preparedEntry } from "@/lib/demo-data";

const evidenceIcon = { lines: IconDoc, history: IconUsers, tax: IconPercent, bank: IconBank } as const;

function StatusBadges() {
  return (
    <span className="stack">
      <span data-ap-status-ready className="pill pill-accent justify-self-end text-[11.5px]!" style={{ opacity: 0 }}>
        Ready for review
      </span>
      <span data-ap-status-approved className="pill pill-ok justify-self-end text-[11.5px]!">
        <IconCheck size={12} strokeWidth={2.4} /> Approved
      </span>
    </span>
  );
}

function Decision({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`relative rounded-xl border border-line bg-canvas/50 ${compact ? "p-3.5" : "p-4"}`}>
      <span data-ap-ring aria-hidden className="pointer-events-none absolute -inset-px rounded-xl ring-[1.5px] ring-accent/70" />
      <div className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-[1.1fr_1.3fr_1fr]"}`}>
        <div data-ap-decision-row>
          <p className="text-[11px] text-muted">Suggested category</p>
          <p className="mt-1 text-[14px] font-semibold">
            <span className="tnum mr-1.5 text-muted">{preparedEntry.lines[0].code}</span>
            {preparedEntry.lines[0].account}
          </p>
        </div>
        <div data-ap-decision-row>
          <p className="text-[11px] text-muted">Suggested VAT treatment</p>
          <p className="mt-1 text-[14px] font-semibold">{preparedEntry.vatTreatment}</p>
          <p className="text-[11.5px] text-muted">Input VAT recoverable, AED {aed(invoice.vat)}</p>
        </div>
        <div data-ap-decision-row>
          <p className="text-[11px] text-muted">Amount (AED)</p>
          <p className="tnum mt-1 text-[14px] font-semibold">{aed(invoice.total)}</p>
          <p className="tnum text-[11.5px] text-muted">
            Net {aed(invoice.net)} · VAT {aed(invoice.vat)}
          </p>
        </div>
      </div>
    </div>
  );
}

function ApproveButton({ large = false }: { large?: boolean }) {
  return (
    <span
      data-ap-approve
      className={`relative inline-grid place-items-center overflow-hidden rounded-lg bg-accent font-medium text-white shadow-[0_1px_2px_rgb(2_50_212/0.3)] ${large ? "h-12 min-w-0 flex-1 px-4 text-[15px]" : "h-9 min-w-[118px] px-3.5 text-[12.5px]"}`}
    >
      <span data-ap-approve-hover aria-hidden className="absolute inset-0 bg-[#0232d4]" style={{ opacity: 0 }} />
      <span className="stack relative">
        <span data-ap-approve-label className="inline-flex items-center justify-center gap-1.5" style={{ opacity: 0 }}>
          <IconCheck size={14} strokeWidth={2.2} /> Approve
        </span>
        <span data-ap-approved-label className="inline-flex items-center justify-center gap-1.5">
          <IconCheck size={14} strokeWidth={2.4} /> Approved
        </span>
      </span>
    </span>
  );
}

function FlagButton({ large = false }: { large?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border border-line bg-paper font-medium ${large ? "h-12 shrink-0 justify-center whitespace-nowrap px-3.5 text-[15px]" : "h-9 px-3 text-[12.5px]"}`}>
      <IconFlag size={14} /> Flag for review
    </span>
  );
}

function DesktopScene() {
  return (
    <Stage
      width={1200}
      height={600}
      label={`Review workspace. The original invoice sits beside the suggested entry: category 6120 Office supplies, VAT standard rated at 5%, with four pieces of supporting evidence and an explanation. The accountant clicks Approve and the status changes from Ready for review to Approved.`}
    >
      <div className="card absolute inset-0 overflow-hidden rounded-2xl! bg-canvas/60 shadow-float!">
        {/* Top bar */}
        <div className="flex h-[52px] items-center gap-3 border-b border-line bg-paper px-5 text-[12.5px]">
          <p className="text-muted">
            Review queue <span className="mx-1 text-faint">/</span> {client.name} <span className="mx-1 text-faint">/</span>{" "}
            <span className="font-medium text-ink">Bill {invoice.number}</span>
          </p>
          <span className="ml-auto text-[11.5px] text-muted">1 of 14</span>
          <StatusBadges />
          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e6ecff] text-[10.5px] font-semibold text-accent-ink">{firm.reviewerInitials}</span>
        </div>

        {/* Source document */}
        <div data-ap-doc className="absolute w-[380px]" style={{ left: 24, top: 70 }}>
          <InvoiceDoc highlights={["lines", "trn", "vat", "total"]} className="shadow-soft!" />
        </div>

        {/* Suggested entry */}
        <div data-ap-panel className="absolute flex flex-col text-[12.5px]" style={{ left: 432, top: 68, right: 24, bottom: 18 }}>
          <div className="flex items-baseline justify-between">
            <p className="text-[15px] font-semibold tracking-[-0.015em]">Suggested entry</p>
            <p className="text-[11.5px] text-muted">
              Prepared by <Brand /> · {preparedEntry.preparedAt}
            </p>
          </div>
          <div className="mt-3">
            <Decision />
          </div>

          <p className="mt-4 text-[11.5px] font-medium text-muted">Supporting evidence</p>
          <div className="mt-2 grid grid-cols-2 gap-2.5">
            {evidence.map((e) => {
              const Icon = evidenceIcon[e.id as keyof typeof evidenceIcon];
              return (
                <div key={e.id} data-ap-evidence={e.id} className="flex gap-2.5 rounded-xl border border-line bg-paper p-3 shadow-soft">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink">
                    <Icon size={14} />
                  </span>
                  <div className="leading-snug">
                    <p className="font-medium">{e.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted">{e.body}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div data-ap-expl className="mt-3 rounded-xl border border-line bg-paper px-3.5 py-2.5 leading-relaxed">
            <p className="text-[11.5px] font-medium text-muted">Why this suggestion</p>
            <p className="mt-0.5 text-[12px]">{explanation}</p>
          </div>

          <div className="mt-auto flex items-center gap-3 border-t border-line pt-3">
            <span className="stack text-[11.5px] text-muted">
              <span data-ap-audit-pending style={{ opacity: 0 }}>
                Nothing is posted until you approve.
              </span>
              <span data-ap-audit-done>
                Approved by {firm.reviewer} · {preparedEntry.approvedAt}
              </span>
            </span>
            <span className="ml-auto flex items-center gap-2">
              <FlagButton />
              <ApproveButton />
            </span>
          </div>
        </div>

        {/* Confirmation toast */}
        <div className="absolute flex justify-center" style={{ left: 24, width: 380, bottom: 22 }}>
          <div data-ap-toast className="flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-[12px] text-white shadow-lift">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-ok">
              <IconCheck size={12} strokeWidth={2.6} />
            </span>
            Entry approved and recorded with its evidence.
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
 * Phones: "Hold to approve". One review card. The evidence sits in chips you
 * can open. At the bottom, press and hold the button until its ring fills to
 * approve, so the visitor does the approving themselves. The first time the
 * card is on screen it shows the gesture once, then hands it over.
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
    <div data-mobile className="container-x mt-10 max-w-xl lg:hidden">
      <div ref={cardRef} data-reveal className="card overflow-hidden text-[13px]">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div className="min-w-0 leading-tight">
            <p className="tnum font-semibold">Bill {invoice.number}</p>
            <p className="truncate text-[12px] text-muted">{invoice.supplier}</p>
          </div>
          <span className={`pill shrink-0 text-[11px]! transition-colors ${approved ? "pill-ok" : "pill-accent"}`} aria-live="polite">
            {approved ? (
              <>
                <IconCheck size={11} strokeWidth={2.6} /> Approved
              </>
            ) : (
              "Ready for review"
            )}
          </span>
        </div>

        <div className="space-y-4 p-4">
          <Decision compact />

          <div>
            <p className="text-[12px] font-medium text-muted">Evidence</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {reasons.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={open === r.id}
                  onClick={() => setOpen(r.id)}
                  className={`min-h-9 rounded-full border px-3 text-[12.5px] font-medium transition-colors ${
                    open === r.id ? "border-accent bg-accent-soft text-accent-ink" : "border-line bg-paper text-muted"
                  }`}
                >
                  {r.title}
                </button>
              ))}
            </div>
            <p key={current.id} className="anim-rise mt-2.5 rounded-xl bg-canvas p-3 leading-relaxed" aria-live="polite">
              {current.body}
            </p>
          </div>

          <div>
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
              className="relative flex h-14 w-full touch-manipulation select-none items-center justify-center gap-3 overflow-hidden rounded-2xl bg-ink text-[15px] font-medium text-white [-webkit-touch-callout:none] disabled:bg-ok"
              style={{ "--p": 0 } as React.CSSProperties}
            >
              <span aria-hidden className="absolute inset-0 origin-left bg-accent transition-opacity" style={{ transform: "scaleX(var(--p))", opacity: approved ? 0 : 1 }} />
              {approved ? (
                <IconCheck size={20} strokeWidth={2.6} className="relative" />
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
            <div className="mt-2.5 flex min-h-6 items-center justify-between text-[12.5px] text-muted">
              <span>
                {approved
                  ? `Approved by you · Recorded with its evidence`
                  : hint === "your-turn"
                    ? "Your turn. Press and hold the button."
                    : "Nothing is posted until someone approves."}
              </span>
              {approved && (
                <button type="button" onClick={reset} className="min-h-9 px-1 font-medium text-ink underline underline-offset-2">
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
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
        Every suggested decision includes its supporting evidence.
      </SectionHeading>
      <div data-desktop className="container-x mt-6 hidden min-h-0 flex-1 lg:block">
        <DesktopScene />
      </div>
      <MobileScene />
    </section>
  );
}
