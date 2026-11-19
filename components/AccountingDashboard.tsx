import { CalendarClock, FileQuestion, FileText, Link2, Percent, Sparkles, type LucideIcon } from "lucide-react";
import { Wordmark } from "./Brand";
import { AppCard, Chip, ConfidenceBar, ICON_SM, ListRow, PillButton, StatTile, type RailSection } from "./app/ui";
import {
  DECISION_STATE_LABEL,
  aed,
  client,
  decisionsByDay,
  readyForSignoff,
  runningTasks,
  vatDeadlines,
  type DecisionKind,
  type DecisionTab,
  type StoryId,
} from "@/lib/demo-data";
import { INITIAL_VIEW, type View } from "@/lib/hero-story";

/**
 * The hero's product UI: the oneth app's Overview (frontend/src/app/overview/OverviewPage.tsx, DESIGN.md "Layouts"),
 * with the landing page's fictional firm. On desktop `OverviewGrid` is the first screen of the clickable app
 * (hero-app/HeroApp.tsx): `view` is the story's live state (lib/hero-story.ts) and `go` opens the other screens. On
 * phones, the two cards that matter most, in their starting state.
 */

/** Opens another screen of the hero's app: a Decisions tab or one decision, or a period's review. */
export type Go = (to: RailSection, opts?: { tab?: DecisionTab; period?: string | null; decision?: StoryId | null }) => void;

export const KIND_ICON: Record<DecisionKind, LucideIcon> = {
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
function Today({ t = INITIAL_VIEW.today }: { t?: View["today"] }) {
  return (
    <AppCard title="Today" className="col-span-4">
      <div className="flex flex-col gap-1">
        <StatTile surface="plain" size="hero" label="oneth completed today" value={`${t.tasksDone} tasks`} />
        <Chip size="sm" tone="accent" className="self-start">
          Working on {t.tasksRunning} now
        </Chip>
      </div>
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
      <div className="mt-auto grid grid-cols-3 gap-2">
        {/* Labels can wrap on narrower screens; the numbers stay on one baseline */}
        <StatTile label="Awaiting review" value={t.awaitingReview} className="justify-between" />
        <StatTile label="Auto-decided" value={pct(t.autoDecided)} className="justify-between" />
        <StatTile label="Overturn rate" value={pct(t.overturnRate)} className="justify-between" />
      </div>
    </AppCard>
  );
}

function NeedsYou({
  className = "",
  go,
  items = INITIAL_VIEW.needsYou,
}: {
  className?: string;
  go?: Go;
  items?: View["needsYou"];
}) {
  return (
    <AppCard title="Needs you" open onOpen={go && (() => go("decisions"))} openLabel="Open Decisions" className={className}>
      <div className="flex flex-col gap-2">
        {items.slice(0, 5).map((d) => (
          <ListRow
            key={d.issue}
            data-guide={d.id === "desert" ? "row-desert" : undefined}
            icon={KIND_ICON[d.kind]}
            iconTone={d.state === "escalated" ? "blocked" : "card"}
            title={d.issue}
            subtitle={`${d.client} · ${DECISION_STATE_LABEL[d.state]}`}
            onClick={go && (() => (d.id ? go("decisions", { decision: d.id }) : go("decisions", { tab: d.state === "escalated" ? "Escalated" : "Awaiting review" })))}
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

function Briefing({ lines }: { lines: string[] }) {
  return (
    <AppCard title="Daily briefing" wash className="col-span-4 xl:col-span-3">
      <div className="flex flex-col gap-3">
        <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-accent-ink">
          <Sparkles {...ICON_SM} />
          oneth
        </span>
        {lines.map((line) => (
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
function DecisionsChart({ go }: { go?: Go }) {
  const max = Math.max(...decisionsByDay.map((d) => Math.max(d.auto, d.reviewed)));
  return (
    <AppCard title="Decisions this week" open onOpen={go && (() => go("performance"))} openLabel="Open Performance" className="col-span-8 xl:col-span-5">
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

function ReadyForSignoff({ go }: { go?: Go }) {
  return (
    <AppCard title="Ready for sign-off" className="col-span-6 xl:col-span-4">
      <div className="flex flex-col gap-2">
        {readyForSignoff.map((p) => (
          <ListRow
            key={p.client}
            icon={CalendarClock}
            title={p.client}
            subtitle={`${p.month} · ready for review`}
            right={
              <PillButton size="sm" onClick={go && (() => go("close", { period: p.client }))}>
                Review
              </PillButton>
            }
          />
        ))}
      </div>
    </AppCard>
  );
}

function VatDeadlines() {
  return (
    <AppCard title="VAT deadlines" className="col-span-6 xl:col-span-3">
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

/**
 * The Overview's bento grid (desktop): the app's 4 / 5 / 3 and 5 / 4 / 3 rows from 1280px. Narrower, Needs you and the
 * chart take two thirds so their rows stay readable, and the briefing moves to the second row.
 */
export function OverviewGrid({ go, view = INITIAL_VIEW }: { go?: Go; view?: View }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <Today t={view.today} />
      <NeedsYou className="col-span-8 xl:col-span-5" go={go} items={view.needsYou} />
      <Briefing lines={view.briefing} />
      <DecisionsChart go={go} />
      <ReadyForSignoff go={go} />
      <VatDeadlines />
    </div>
  );
}

/**
 * Phones and tablets: the app is desktop-first, so the hero shows one flat card with the Overview's two most useful
 * parts, Today and the top of Needs you, in their starting state. One box, divided by hairlines (no tiles inside cards
 * inside a frame), short enough to fit a phone screen above the tab bar.
 */
function CompactDashboard() {
  const t = INITIAL_VIEW.today;
  const stats = [
    { label: "Awaiting review", value: t.awaitingReview },
    { label: <span className="whitespace-nowrap max-[359px]:whitespace-normal">Auto-decided</span>, value: pct(t.autoDecided) },
    { label: "Overturn rate", value: pct(t.overturnRate) },
  ];
  // "Saffron Grove Restaurants LLC" would be cut off on a phone; the app's short name fits
  const short = (name: string) => (name === client.name ? client.short : name.replace(/\s+(FZ-LLC|FZE|LLC)$/, ""));
  return (
    <div className="overflow-hidden rounded-app-card border border-line bg-paper font-app text-ink antialiased shadow-lift">
      <div className="flex items-center justify-between gap-3 border-b border-line-soft px-5 py-3">
        <Wordmark className="h-[17px]" />
        <span className="inline-flex h-8 items-center gap-2 rounded-full bg-accent-soft px-3 text-[12px] font-semibold text-accent-ink">
          <span className="size-1.5 rounded-full bg-accent" />
          Shadow mode
        </span>
      </div>

      <div className="px-5 pb-5 pt-4">
        <p className="text-[15px] font-semibold leading-[22px]">Today</p>
        <p className="mt-3 text-[13px] leading-[18px] text-muted">oneth completed today</p>
        <p className="text-[36px] font-semibold leading-[44px] tracking-[-0.02em] tabular-nums">{t.tasksDone} tasks</p>
        <Chip size="sm" tone="accent" className="mt-1">
          Working on {t.tasksRunning} now
        </Chip>
        <div className="mt-5 grid grid-cols-[5fr_6fr_6fr] divide-x divide-line-soft border-t border-line-soft pt-4">
          {stats.map((s, i) => (
            <div key={i} className="flex flex-col gap-1 px-2.5 first:pl-0 last:pr-0">
              <span className="text-[24px] font-semibold leading-[30px] tracking-[-0.015em] tabular-nums">{s.value}</span>
              <span className="text-[12px] leading-[17px] text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line-soft px-5 pt-4">
        <p className="text-[15px] font-semibold leading-[22px]">Needs you</p>
        <ul className="divide-y divide-line-soft">
          {INITIAL_VIEW.needsYou.slice(0, 2).map((d) => {
            const Icon = KIND_ICON[d.kind];
            return (
              <li key={d.issue} className="flex gap-3 py-4">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full ${d.state === "escalated" ? "bg-blocked-soft text-blocked" : "bg-line-soft text-ink"}`}
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[14px] font-semibold leading-[19px]">{d.issue}</p>
                  <p className="mt-0.5 truncate text-[12.5px] leading-[17px] text-muted">
                    {short(d.client)} · {DECISION_STATE_LABEL[d.state]}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between gap-3">
                    <span className="whitespace-nowrap text-[13.5px] font-semibold tabular-nums">AED {aed(d.amount)}</span>
                    <ConfidenceBar value={d.confidence} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default CompactDashboard;
