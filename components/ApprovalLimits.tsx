"use client";

import { useRef, type ReactNode } from "react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import Stage from "./Stage";
import { IconLock, IconSettings, IconUsers } from "./icons";
import { limitsAnimation, useGSAP } from "@/lib/animations";
import { approvalLimits, firm, limitBands, limitStages, type LimitHolder } from "@/lib/demo-data";

/*
 * "You set the limits": an approval-limits grid, the way firms already set
 * limits for their staff. In the pilot every cell sits with the team. As the
 * months pass, partners hand routine, low-value cells to the platform, while
 * new, unusual and large items stay with people. Tax returns are never handed over.
 * Markup is the Month 3 state; the timeline starts from the pilot month.
 */

const HOLDER_STYLE: Record<LimitHolder, string> = {
  oneth: "bg-accent text-white shadow-[0_1px_2px_rgb(2_50_212/0.3)]",
  team: "border border-line bg-paper text-ink",
  partner: "bg-ink text-white",
};

function HolderLabel({ holder, compact }: { holder: LimitHolder; compact: boolean }) {
  if (holder === "oneth") return <Brand />;
  if (holder === "partner") return <>Partner</>;
  return (
    <span className="inline-flex items-center gap-1.5">
      {!compact && <IconUsers size={13} />}
      {compact ? "Team" : "Your team"}
    </span>
  );
}

function Cell({ holder, from, compact }: { holder: LimitHolder; from?: number; compact: boolean }) {
  const base = `grid h-full w-full place-items-center rounded-lg font-medium ${compact ? "text-[11.5px]" : "text-[12.5px]"}`;
  if (!from) {
    return (
      <span className={`${base} ${HOLDER_STYLE[holder]}`}>
        <HolderLabel holder={holder} compact={compact} />
      </span>
    );
  }
  // A cell that moves from the team to the platform: both states stacked, finished state on top.
  return (
    <span data-limit-cell data-from={from} className="stack h-full w-full">
      <span data-limit-before aria-hidden className={`${base} ${HOLDER_STYLE.team}`} style={{ opacity: 0 }}>
        <HolderLabel holder="team" compact={compact} />
      </span>
      <span data-limit-after className={`${base} ${HOLDER_STYLE.oneth}`}>
        <HolderLabel holder="oneth" compact={compact} />
      </span>
    </span>
  );
}

function Stepper({ compact = false }: { compact?: boolean }) {
  return (
    <div data-limit-stepper className={compact ? "" : "w-[640px]"}>
      <div className="relative grid grid-cols-3">
        <span aria-hidden className="absolute left-[16.667%] right-[16.667%] top-[7px] h-0.5 rounded-full bg-line" />
        <span data-limit-progress aria-hidden className="absolute left-[16.667%] right-[16.667%] top-[7px] h-0.5 origin-left rounded-full bg-accent" />
        {limitStages.map((s) => (
          <div key={s.id} className="relative flex flex-col items-center gap-2">
            <span className="stack">
              <span className="h-4 w-4 rounded-full border-2 border-line bg-paper" />
              <span data-limit-dot={s.id} className="h-4 w-4 rounded-full border-2 border-accent bg-accent ring-4 ring-accent-soft" />
            </span>
            <span className={`font-medium ${compact ? "text-[12px]" : "text-[13px]"}`}>{s.label}</span>
          </div>
        ))}
      </div>
      <div className={`stack mt-3 w-full text-center text-muted ${compact ? "text-[13px]" : "text-[13.5px]"}`}>
        {limitStages.map((s) => (
          <p key={s.id} data-limit-caption={s.id} className="text-balance" style={{ opacity: s.id === 3 ? 1 : 0 }}>
            <span className="sr-only">{s.label}: </span>
            {s.caption}
          </p>
        ))}
      </div>
    </div>
  );
}

const footnote = "Example limits for illustration. Partners set them in oneth's settings, and a change applies to the next decision.";

function Key() {
  const items: { holder: LimitHolder; label: ReactNode }[] = [
    { holder: "oneth", label: <><Brand /> does it alone</> },
    { holder: "team", label: "Your team approves" },
    { holder: "partner", label: "A partner approves" },
  ];
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted`}>
      {items.map((i) => (
        <li key={i.holder} className="flex items-center gap-1.5">
          <span aria-hidden className={`h-3 w-3 rounded-[4px] ${HOLDER_STYLE[i.holder]}`} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function GridHeader({ compact }: { compact: boolean }) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 border-b border-line ${compact ? "px-4 py-3" : "px-5 py-3"}`}>
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-canvas text-ink">
          <IconSettings size={16} />
        </span>
        <div className="leading-tight">
          <p className="text-[13px] font-semibold">Approval limits</p>
          <p className="text-[11.5px] text-muted">{firm.name} · set by partners</p>
        </div>
      </div>
      {!compact && <Key />}
    </div>
  );
}

const neverText = "Never. Always signed off and filed by your firm.";

function DesktopGrid() {
  const cols = "grid-cols-[260px_repeat(3,minmax(0,1fr))]";
  return (
    <div data-limit-grid className="card w-[1080px] overflow-hidden shadow-lift">
      <GridHeader compact={false} />
      <div className={`grid ${cols} gap-x-3 border-b border-line bg-canvas/60 px-5 py-2 text-[11.5px] text-muted`}>
        <span>Work</span>
        {limitBands.map((b) => (
          <span key={b.long} className="text-center">
            {b.long}
          </span>
        ))}
      </div>
      {approvalLimits.map((row) => (
        <div key={row.work} data-limit-row className={`grid ${cols} items-center gap-x-3 border-b border-line-soft px-5 py-2`}>
          <span className="text-[13px] font-medium">{row.work}</span>
          {row.cells.map((c, i) => (
            <div key={i} className="h-10">
              <Cell holder={c.holder} from={c.from} compact={false} />
            </div>
          ))}
        </div>
      ))}
      <div data-limit-row className="grid grid-cols-[260px_minmax(0,1fr)] items-center gap-x-3 px-5 py-2">
        <span className="text-[13px] font-medium">File a tax return</span>
        <span className="flex h-10 items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-line-soft text-[12.5px] font-medium text-muted">
          <IconLock size={14} /> {neverText}
        </span>
      </div>
    </div>
  );
}

function DesktopScene() {
  return (
    <Stage
      width={1200}
      height={600}
      label="An approval limits grid for an accounting firm. In the pilot month the team approves every kind of work. By month 3, partners have let the platform code routine expenses and match exact bank lines up to AED 10,000, and apply standard rated VAT under AED 1,000. Requests to clients are always sent by a person. New suppliers, unusual items and large amounts stay with the team or a partner. Filing a tax return is never handed over."
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
        <Stepper />
        <DesktopGrid />
        <p data-limit-note className="text-[11.5px] text-faint">
          {footnote}
        </p>
      </div>
    </Stage>
  );
}

/**
 * Phones: the same grid, one row per kind of work with its three amount bands underneath.
 * The month stepper sticks to the top while the grid scrolls under it, so the month is
 * always in view when its cells change hands.
 */
function MobileScene() {
  return (
    <div data-mobile className="container-x mt-10 max-w-xl lg:hidden">
      <div className="relative">
        <div data-reveal className="card sticky top-3 z-10 px-4 pb-4 pt-5 shadow-lift">
          <Stepper compact />
        </div>
        <div data-limit-grid className="card mt-3 overflow-hidden">
          <GridHeader compact />
          <div className="grid grid-cols-3 gap-1.5 border-b border-line bg-canvas/60 px-4 py-2 text-center text-[10.5px] leading-tight text-muted">
            {limitBands.map((b) => (
              <span key={b.short}>{b.short}</span>
            ))}
          </div>
          {approvalLimits.map((row) => (
            <div key={row.work} data-limit-row className="border-b border-line-soft px-4 py-3">
              <p className="text-[13px] font-medium">{row.work}</p>
              <div className="mt-2 grid grid-cols-3 gap-1.5">
                {row.cells.map((c, i) => (
                  <div key={i} className="h-9">
                    <Cell holder={c.holder} from={c.from} compact />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div data-limit-row className="px-4 py-3">
            <p className="text-[13px] font-medium">File a tax return</p>
            <p className="mt-2 flex min-h-9 items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-line-soft px-3 py-2 text-center text-[12px] font-medium text-muted">
              <IconLock size={13} /> {neverText}
            </p>
          </div>
          <div className="border-t border-line bg-canvas/50 px-4 py-3">
            <Key />
            <p className="mt-1.5 text-[11px] text-muted">Amounts in AED.</p>
          </div>
        </div>
      </div>
      <p className="mt-4 px-1 text-[12.5px] leading-relaxed text-muted">{footnote}</p>
    </div>
  );
}

export default function ApprovalLimits() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      const mm = limitsAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="limits" aria-labelledby="limits-title" className="relative py-24 sm:py-28 lg:flex lg:h-svh lg:flex-col lg:pb-5 lg:pt-20">
      <SectionHeading id="limits-title" eyebrow="You set the limits" title="Autonomy, earned one limit at a time." className="container-x" pinned>
        Your team approves everything in the pilot. Then your partners choose what <Brand className="font-medium text-ink" /> may do alone.
      </SectionHeading>
      <div data-desktop className="container-x mt-6 hidden min-h-0 flex-1 lg:block">
        <DesktopScene />
      </div>
      <MobileScene />
    </section>
  );
}
