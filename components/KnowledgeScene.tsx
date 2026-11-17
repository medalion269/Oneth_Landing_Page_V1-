"use client";

import { useRef } from "react";
import { History } from "lucide-react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import Stage from "./Stage";
import { AppCard, AppRail, AppTopBar, Chip, ConfidenceBar, IconCircle, PillTabs } from "./app/ui";
import { knowledgeAnimation, useGSAP } from "@/lib/animations";
import { aed, client, invoice, newPrecedent, nextInvoice, olderPrecedents, preparedEntry } from "@/lib/demo-data";

/*
 * Knowledge, "a precedent is born": the oneth app's Knowledge screen, Precedents tab (frontend/src/app/knowledge).
 * The bill approved in Review was saved as a precedent; it drops into the list. Then the next bill from the same
 * supplier arrives, and oneth proposes it citing that precedent. Markup is the finished state.
 */

const TABS = ["Policies", "Rules", "Supplier mappings", "Precedents"] as const;
const [costLine, vatLine, payableLine] = preparedEntry.lines;

/** A precedent row, as the app's list row: History icon, pattern, summary and date, scope and how often it was used. */
function PrecedentRow({
  pattern,
  summary,
  date,
  scope,
  used,
  isNew = false,
  compact = false,
}: {
  pattern: string;
  summary: string;
  date: string;
  scope: string;
  used: number | [number, number];
  isNew?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      {...(isNew ? { "data-kn-new": "" } : { "data-kn-row": "" })}
      className={`relative flex items-center gap-3 rounded-app-tile px-4 py-3 ${isNew ? "bg-accent-soft" : "bg-line-soft"} ${compact ? "flex-wrap" : ""}`}
    >
      <IconCircle icon={History} tone={isNew ? "card" : "card"} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-center gap-2 truncate text-[14px] font-semibold leading-[20px]">
          {pattern}
          {isNew && (
            <Chip size="sm" tone="accent">
              New
            </Chip>
          )}
        </span>
        <span className={`text-[13px] leading-[18px] text-muted ${compact ? "" : "truncate"}`}>
          {summary} · {date}
        </span>
      </span>
      <span className={`flex shrink-0 items-center gap-2 ${compact ? "basis-full pl-12" : ""}`}>
        <Chip size="sm" tone="neutral">
          {scope}
        </Chip>
        {Array.isArray(used) ? (
          <span className="stack text-[13px] text-muted tabular-nums">
            <span data-kn-used-before aria-hidden style={{ opacity: 0 }}>
              Used {used[0]}×
            </span>
            <span data-kn-used-after>Used {used[1]}×</span>
          </span>
        ) : (
          <span className="text-[13px] text-muted tabular-nums">Used {used}×</span>
        )}
      </span>
    </div>
  );
}

function PrecedentList({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <PrecedentRow {...newPrecedent} used={[0, 1]} isNew compact={compact} />
      {olderPrecedents.map((p) => (
        <PrecedentRow key={p.pattern} {...p} compact={compact} />
      ))}
    </div>
  );
}

/** The next bill's decision record: the same supplier, now citing the new precedent. */
function NextDecision({ compact = false }: { compact?: boolean }) {
  const rows: [string, string, boolean?][] = [
    ["Supplier mapping", `${costLine.code} · ${costLine.account} · SR`],
    ["Precedents", `1 applied · ${newPrecedent.pattern}`, true],
  ];
  return (
    <AppCard
      data-kn-next
      title="Decision record"
      action={
        <Chip size="sm" tone="review">
          Awaiting review
        </Chip>
      }
      className={compact ? "" : "h-full"}
    >
      <div data-kn-part className="flex flex-col gap-1">
        <p className="text-[12px] font-semibold text-muted">Issue</p>
        <p className="text-[14px] font-semibold leading-[20px]">
          Classify {invoice.supplierShort} invoice {nextInvoice.number}
        </p>
        <p className="text-[13px] text-muted">
          {client.name} · {nextInvoice.date}
        </p>
      </div>
      <dl data-kn-part className="flex flex-col">
        {rows.map(([label, value, cite]) => (
          <div
            key={label}
            {...(cite ? { "data-kn-cite": "" } : {})}
            className={`flex items-baseline justify-between gap-4 border-b border-line-soft py-1.5 text-[13px] last:border-0 ${cite ? "-mx-2 rounded-lg bg-accent-soft px-2" : ""}`}
          >
            <dt className="shrink-0 text-muted">{label}</dt>
            <dd className={`min-w-0 truncate text-right ${cite ? "font-semibold text-accent-ink" : ""}`}>{value}</dd>
          </div>
        ))}
      </dl>
      <div data-kn-part className="flex flex-col gap-1">
        <p className="text-[12px] font-semibold text-muted">Proposal</p>
        <table className="w-full table-fixed text-[13px] tabular-nums">
          <colgroup>
            <col />
            <col className="w-[72px]" />
            <col className="w-[72px]" />
          </colgroup>
          <tbody>
            {[
              [`${costLine.code} ${costLine.account}`, aed(nextInvoice.net), ""],
              [`${vatLine.code} ${vatLine.account}`, aed(nextInvoice.vat), ""],
              [`${payableLine.code} Accounts payable`, "", aed(nextInvoice.total)],
            ].map(([acc, dr, cr]) => (
              <tr key={acc} className="border-t border-line-soft first:border-0">
                <td className="truncate py-1 pr-2">{acc}</td>
                <td className="py-1 text-right">{dr}</td>
                <td className="py-1 text-right">{cr}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <span data-kn-part className="flex items-center gap-2">
        <ConfidenceBar value={nextInvoice.confidence} />
        <span className="text-[13px] text-muted">High, from your team&apos;s precedent</span>
      </span>
    </AppCard>
  );
}

function DesktopScene() {
  return (
    <Stage
      width={1200}
      height={600}
      label={`The oneth app's Knowledge screen, Precedents tab. A new precedent, ${newPrecedent.pattern}, saved when the team approved invoice ${invoice.number}, joins the list. Then the next invoice from the same supplier, ${nextInvoice.number} for AED ${aed(nextInvoice.total)}, arrives, and oneth proposes it citing that precedent with high confidence. It waits for review.`}
    >
      <div className="absolute inset-0 flex overflow-hidden rounded-[18px] border border-line bg-canvas font-app text-ink shadow-float antialiased">
        <AppRail active="knowledge" badge={13} />
        <div className="flex min-w-0 flex-1 flex-col px-6 pb-6">
          <AppTopBar title="Knowledge" />
          <PillTabs items={TABS} active="Precedents" className="self-start" />
          <div className="mt-4 grid min-h-0 flex-1 grid-cols-12 grid-rows-[minmax(0,1fr)] gap-4">
            <AppCard title="Precedents" className="col-span-7 h-full overflow-hidden">
              <PrecedentList />
            </AppCard>
            <div className="col-span-5 min-h-0">
              <NextDecision />
            </div>
          </div>
        </div>
      </div>
      {/* From the new precedent to the decision that cites it: positioned by lib/animations.ts */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width={1200} height={600} viewBox="0 0 1200 600">
        <path data-kn-link pathLength={1} fill="none" stroke="#033FFE" strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="1" strokeDashoffset={0} />
        <circle data-kn-link-end r={3.5} fill="#033FFE" />
        <circle data-kn-link-end r={3.5} fill="#033FFE" />
      </svg>
    </Stage>
  );
}

/** Phones: the list, the new precedent dropping in, then the next bill's decision citing it. */
function MobileScene() {
  return (
    <div data-mobile className="container-x mt-10 flex max-w-xl flex-col gap-3 font-app antialiased lg:hidden">
      <AppCard title="Precedents" data-kn-list>
        <PrecedentList compact />
      </AppCard>
      <NextDecision compact />
    </div>
  );
}

export default function KnowledgeScene() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      const mm = knowledgeAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="knowledge" aria-labelledby="knowledge-title" className="relative py-24 sm:py-28 lg:flex lg:h-svh lg:flex-col lg:pb-5 lg:pt-20">
      <SectionHeading id="knowledge-title" eyebrow="Knowledge" title="Approvals become precedents." className="container-x" pinned>
        Save an approval as a precedent and <Brand className="font-medium text-ink" /> cites it the next time that kind of bill arrives.
      </SectionHeading>
      <div data-desktop className="container-x mt-6 hidden min-h-0 flex-1 lg:block">
        <DesktopScene />
      </div>
      <MobileScene />
    </section>
  );
}
