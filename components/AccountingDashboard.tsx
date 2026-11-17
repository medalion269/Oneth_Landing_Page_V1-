import { CalendarClock, FileQuestion, FileText, Link2, Percent, Sparkles, type LucideIcon } from "lucide-react";
import { Wordmark } from "./Brand";
import { AppCard, AppFrame, Chip, ConfidenceBar, ICON_SM, ListRow, PillButton, ShadowModePill, StatTile } from "./app/ui";
import {
  DECISION_STATE_LABEL,
  aed,
  briefing,
  decisionsByDay,
  needsYou,
  overviewToday,
  readyForSignoff,
  runningTasks,
  vatDeadlines,
  type DecisionKind,
} from "@/lib/demo-data";

/**
 * The hero's product UI: the oneth app's Overview (frontend/src/app/overview/OverviewPage.tsx, DESIGN.md "Layouts"),
 * with the landing page's fictional firm. Full size on desktop; on phones, the two cards that matter most.
 */

const KIND_ICON: Record<DecisionKind, LucideIcon> = {
  classification: FileText,
  bank_match: Link2,
  vat_treatment: Percent,
  missing_evidence: FileQuestion,
};

const pct = (r: number) => `${Math.round(r * 100)}%`;

/**
 * Today. On desktop the card shares a row with Needs you, which is taller, so instead of leaving that height empty it
 * lists the tasks behind "Working on 2 now", as the app's Work in progress card shows them (type · client, progress).
 */
function Today({ compact = false }: { compact?: boolean }) {
  const t = overviewToday;
  return (
    <AppCard title="Today" className={compact ? "" : "col-span-4"}>
      <div className="flex flex-col gap-1">
        <StatTile surface="plain" size="hero" label="oneth completed today" value={`${t.tasksDone} tasks`} />
        <Chip size="sm" tone="accent" className="self-start">
          Working on {t.tasksRunning} now
        </Chip>
      </div>
      {!compact && (
        <ul className="flex flex-col gap-2">
          {runningTasks.map((task) => (
            <li key={task.type} className="flex items-center gap-3 rounded-app-tile bg-line-soft px-4 py-2.5">
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span className="truncate text-[13px] font-semibold leading-[18px]">
                  {task.type} · {task.client}
                </span>
                <span className="block h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-paper">
                  <span className="block h-full rounded-full bg-accent" style={{ width: `${task.progress}%` }} />
                </span>
              </span>
              <Chip size="sm" tone="progress">
                {task.progress}%
              </Chip>
            </li>
          ))}
        </ul>
      )}
      <div className={`grid grid-cols-3 gap-2 ${compact ? "" : "mt-auto"}`}>
        {/* Labels can wrap on narrower screens; the numbers stay on one baseline */}
        <StatTile label="Awaiting review" value={t.awaitingReview} className="justify-between" />
        <StatTile label="Auto-decided" value={pct(t.autoDecided)} className="justify-between" />
        <StatTile label="Overturn rate" value={pct(t.overturnRate)} className="justify-between" />
      </div>
    </AppCard>
  );
}

function NeedsYou({ rows = needsYou.length, stacked = false, className = "" }: { rows?: number; stacked?: boolean; className?: string }) {
  return (
    <AppCard title="Needs you" open className={className}>
      <div className="flex flex-col gap-2">
        {needsYou.slice(0, rows).map((d) => (
          <ListRow
            key={d.issue}
            stacked={stacked}
            icon={KIND_ICON[d.kind]}
            iconTone={d.state === "escalated" ? "blocked" : "card"}
            title={d.issue}
            subtitle={`${d.client} · ${DECISION_STATE_LABEL[d.state]}`}
            right={
              <>
                <span className="whitespace-nowrap font-semibold">AED {aed(d.amount)}</span>
                <ConfidenceBar value={d.confidence} />
              </>
            }
          />
        ))}
      </div>
    </AppCard>
  );
}

function Briefing() {
  return (
    <AppCard title="Daily briefing" wash className="col-span-3">
      <div className="flex flex-col gap-3">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-accent-ink">
          <Sparkles {...ICON_SM} />
          oneth
        </span>
        {briefing.map((line) => (
          <p key={line} className="text-[14px] leading-[20px] text-ink">
            {line}
          </p>
        ))}
      </div>
    </AppCard>
  );
}

/**
 * Rounded bars per day: blue for what oneth decided within its permissions, grey for what people reviewed. The chart
 * takes the card's full height (the app's chart is tall too), so the card has no empty strip under it.
 */
function DecisionsChart() {
  const max = Math.max(...decisionsByDay.map((d) => Math.max(d.auto, d.reviewed)));
  return (
    <AppCard title="Decisions this week" open className="col-span-5">
      <div className="flex items-center gap-4 text-[13px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-accent" /> Auto-decided
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-muted" /> Reviewed
        </span>
      </div>
      <div className="flex min-h-40 flex-1 items-end justify-between gap-3 px-2">
        {decisionsByDay.map((d) => (
          <div key={d.day} className="flex h-full flex-1 flex-col items-center gap-2">
            <div className="flex min-h-0 flex-1 items-end gap-1">
              <span className="w-3.5 rounded-t-md bg-accent" style={{ height: `${(d.auto / max) * 100}%` }} />
              <span className="w-3.5 rounded-t-md bg-muted" style={{ height: `${(d.reviewed / max) * 100}%` }} />
            </div>
            <span className="text-[12px] text-faint">{d.day}</span>
          </div>
        ))}
      </div>
    </AppCard>
  );
}

function ReadyForSignoff() {
  return (
    <AppCard title="Ready for sign-off" className="col-span-4">
      <div className="flex flex-col gap-2">
        {readyForSignoff.map((p) => (
          <ListRow
            key={p.client}
            icon={CalendarClock}
            title={p.client}
            subtitle={`${p.month} · ready for review`}
            right={<PillButton size="sm">Review</PillButton>}
          />
        ))}
      </div>
    </AppCard>
  );
}

function VatDeadlines() {
  return (
    <AppCard title="VAT deadlines" className="col-span-3">
      <div className="flex flex-col gap-2">
        {vatDeadlines.map((d) => (
          <ListRow
            key={d.client}
            title={d.client}
            subtitle={`VAT return · ${d.due}`}
            right={
              <Chip size="sm" tone="neutral">
                {d.daysLeft} days left
              </Chip>
            }
          />
        ))}
      </div>
    </AppCard>
  );
}

function FullDashboard() {
  return (
    <AppFrame
      section="overview"
      title="Overview"
      badge={overviewToday.awaitingReview}
      className="rounded-[18px] border border-line shadow-float"
      frameProps={{ "data-dash-frame": "" }}
    >
      <div className="grid grid-cols-12 gap-4">
        <Today />
        <NeedsYou className="col-span-5" />
        <Briefing />
        <DecisionsChart />
        <ReadyForSignoff />
        <VatDeadlines />
      </div>
    </AppFrame>
  );
}

/** Phones: the app is desktop-first, so the phone shows its two most useful cards under a compact bar. */
function CompactDashboard() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-line bg-canvas font-app text-ink antialiased shadow-lift">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <Wordmark className="h-[18px]" />
        <span className="origin-right scale-90">
          <ShadowModePill />
        </span>
      </div>
      <div className="flex flex-col gap-3 px-3 pb-3">
        <Today compact />
        <NeedsYou rows={3} stacked />
      </div>
    </div>
  );
}

export default function AccountingDashboard({ variant = "full" }: { variant?: "full" | "compact" }) {
  return variant === "full" ? <FullDashboard /> : <CompactDashboard />;
}
