"use client";

/**
 * The hero app's other screens, behind the rail: Clients, Work, Decisions, Period close, Knowledge, Performance and
 * Settings. Each follows its page in the app (frontend/src/app/<section>/*Page.tsx): titles, columns, tabs, chips and
 * empty-state wording come from there. Data is the landing page's fictional firm (lib/demo-data.ts).
 *
 * Screens never scroll on their own: the frame clips them like a screenshot, so the mouse wheel always scrolls the
 * page and nobody gets stuck inside the hero.
 */

import { useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarClock,
  Check,
  ChevronDown,
  History,
  Lock,
  Plug,
  Plus,
  ScrollText,
  Search,
  Undo2,
  Upload,
  User,
} from "lucide-react";
import { KIND_ICON } from "../AccountingDashboard";
import { AppCard, Chip, ConfidenceBar, ICON, ICON_SM, ListRow, PillButton, PillTabs, StatTile, type Tone } from "../app/ui";
import {
  CONNECTION_LABEL,
  DECISION_KIND_LABEL,
  DECISION_TABS,
  KNOWLEDGE_TABS,
  PERFORMANCE_RANGES,
  PERMISSION_MODE_LABEL,
  SETTINGS_TABS,
  TASK_GROUPS,
  aed,
  branding,
  firm,
  formatTrn,
  integrations,
  performance,
  periodsReady,
  permissionSettings,
  policies,
  rules,
  supplierMappings,
  team,
  type ConnectionState,
  type DecisionTab,
  type KnowledgeTab,
  type PerformanceRange,
  type SettingsTab,
  type TaskStatus,
  type StoryId,
} from "@/lib/demo-data";
import { CHECKLIST_CHIP, INITIAL_VIEW, SG_NOVEMBER, type PeriodView, type View } from "@/lib/hero-story";

const pct = (r: number) => `${Math.round(r * 100)}%`;

const CONNECTION_TONE: Record<ConnectionState, Tone> = {
  connected: "done",
  syncing: "progress",
  error: "blocked",
  not_connected: "neutral",
};

/** A small dropdown or input as the app draws it (static here). */
function FieldPill({ children, icon }: { children: ReactNode; icon?: "search" | "chevron" }) {
  return (
    <span className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-line-soft px-4 text-[13px] font-semibold text-ink">
      {icon === "search" && <Search {...ICON_SM} className="text-muted" />}
      {children}
      {icon === "chevron" && <ChevronDown {...ICON_SM} className="text-muted" />}
    </span>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-app-tile bg-line-soft px-4 py-3 text-[14px] leading-[20px] text-muted">{children}</p>;
}

/* ------------------------------------------------------------------ */
/* Clients                                                             */
/* ------------------------------------------------------------------ */

export function ClientsScreen({ view = INITIAL_VIEW }: { view?: View }) {
  const head = "py-2 pr-4 text-left text-[13px] font-normal text-muted";
  return (
    <AppCard
      title="Portfolio"
      action={
        <PillButton size="sm">
          <Plus {...ICON_SM} /> Add client
        </PillButton>
      }
    >
      <table className="w-full table-fixed text-[14px] leading-[20px]">
        <colgroup>
          <col className="w-[26%]" />
          <col className="w-[16%]" />
          <col className="w-[12%]" />
          <col className="w-[14%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[10%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-line-soft">
            <th className={head}>Client</th>
            <th className={head}>TRN</th>
            <th className={head}>Industry</th>
            <th className={head}>Accounting system</th>
            <th className={head}>VAT period</th>
            <th className={head}>Connection</th>
            <th className={`${head} pr-0 text-right`}>Open items</th>
          </tr>
        </thead>
        <tbody>
          {view.portfolio.map((c) => (
            <tr key={c.name} className="border-b border-line-soft last:border-0">
              <td className="truncate py-3 pr-4 font-semibold">{c.name}</td>
              <td className="truncate py-3 pr-4 tabular-nums text-muted">{c.trn ? formatTrn(c.trn) : "—"}</td>
              <td className="truncate py-3 pr-4">{c.industry}</td>
              <td className="truncate py-3 pr-4">{c.system}</td>
              <td className="truncate py-3 pr-4">{c.vatPeriod}</td>
              <td className="py-3 pr-4">
                <Chip size="sm" tone={CONNECTION_TONE[c.connection]}>
                  {CONNECTION_LABEL[c.connection]}
                </Chip>
              </td>
              <td className="py-3 text-right tabular-nums">
                {c.openItems > 0 ? (
                  <Chip size="sm" tone="review">
                    {c.openItems}
                  </Chip>
                ) : (
                  <span className="text-muted">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AppCard>
  );
}

/* ------------------------------------------------------------------ */
/* Work                                                                */
/* ------------------------------------------------------------------ */

const TASK_TONE: Record<TaskStatus, Tone> = {
  running: "progress",
  queued: "neutral",
  blocked: "blocked",
  failed: "blocked",
  done: "done",
};

function WorkRow({ task }: { task: View["work"][number] }) {
  return (
    <div className="grid grid-cols-12 items-center gap-4 rounded-app-tile bg-line-soft px-4 py-3">
      <span className="col-span-4 flex min-w-0 flex-col">
        <span className="truncate text-[14px] font-semibold leading-[20px]">{task.type}</span>
        <span className="truncate text-[13px] leading-[18px] text-muted">{task.client}</span>
      </span>
      <span className="col-span-5 min-w-0">
        {task.status === "running" && (
          <span className="block h-1.5 w-full max-w-72 overflow-hidden rounded-full bg-paper">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${task.progress ?? 0}%` }} />
          </span>
        )}
        {task.status === "blocked" && <span className="text-[13px] leading-[18px] text-blocked">{task.blocker}</span>}
        {task.status === "failed" && <span className="text-[13px] leading-[18px] text-blocked">oneth gave up after several attempts.</span>}
      </span>
      <span className="col-span-3 flex flex-col items-end text-right text-[13px] leading-[18px] text-muted tabular-nums">
        <span>
          {task.status === "queued" ? "Queued" : "Started"} {task.at}
        </span>
        {task.finished && <span>Finished {task.finished}</span>}
        {task.status === "running" && <span className="text-[14px] font-semibold text-ink">{task.progress}%</span>}
      </span>
    </div>
  );
}

export function WorkScreen({ view = INITIAL_VIEW }: { view?: View }) {
  return (
    <div className="flex flex-col gap-4">
      {TASK_GROUPS.map((g) => {
        const rows = view.work.filter((t) => t.status === g.status);
        const count = rows.length;
        return (
          <AppCard
            key={g.status}
            title={
              <span className="inline-flex items-center gap-2">
                {g.title}
                <Chip size="sm" tone={count ? TASK_TONE[g.status] : "neutral"}>
                  {count}
                </Chip>
              </span>
            }
          >
            {rows.length ? (
              <div className="flex flex-col gap-2">
                {rows.map((task) => (
                  <WorkRow key={`${task.type}-${task.client}-${task.at}`} task={task} />
                ))}
              </div>
            ) : (
              <Empty>{g.empty}</Empty>
            )}
          </AppCard>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Decisions                                                           */
/* ------------------------------------------------------------------ */

function PrecedentsCard({ firmWide, oneClient, search, items }: { firmWide: string; oneClient: string; search: string; items: View["precedents"] }) {
  return (
    <AppCard title="Precedents" action={<FieldPill icon="search">{search}</FieldPill>}>
      <div className="flex flex-col gap-2">
        {items.map((p) => (
          <ListRow
            key={p.pattern}
            icon={History}
            title={p.pattern}
            subtitle={`${p.summary} · ${p.date}`}
            right={
              <>
                <Chip size="sm">{p.scope === "Firm-wide" ? firmWide : oneClient}</Chip>
                <span className="w-16 text-right text-[13px] text-muted">Used {p.used}×</span>
              </>
            }
          />
        ))}
      </div>
    </AppCard>
  );
}

const EMPTY_QUEUE: Partial<Record<DecisionTab, string>> = {
  "Awaiting review": "Nothing is waiting for review.",
  Escalated: "Nothing has been escalated.",
  Overturned: "No decisions have been overturned.",
};

export function DecisionsScreen({
  tab,
  onTab,
  onOpen,
  view = INITIAL_VIEW,
}: {
  tab: DecisionTab;
  onTab: (tab: DecisionTab) => void;
  /** Opens one of Saffron Grove's story decisions. */
  onOpen?: (id: StoryId) => void;
  view?: View;
}) {
  const rows = tab === "Precedents" ? [] : view.queue[tab];
  // The queue holds more than fits: the Overview's Awaiting review count
  const more = tab === "Awaiting review" && view.awaiting > rows.length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <PillTabs items={DECISION_TABS} active={tab} onSelect={onTab} />
        <PillButton>
          <Upload {...ICON_SM} /> Upload document
        </PillButton>
      </div>
      {tab === "Precedents" ? (
        <PrecedentsCard firmWide="Whole firm" oneClient="This client" search="Search supplier or summary" items={view.precedents} />
      ) : (
        <AppCard
          title={tab}
          action={
            <span className="flex items-center gap-2">
              <FieldPill icon="chevron">All clients</FieldPill>
              <FieldPill icon="chevron">All types</FieldPill>
              <FieldPill icon="chevron">Any confidence</FieldPill>
            </span>
          }
        >
          {rows.length ? (
            <div className="flex flex-col gap-2">
              {rows.map((d) => (
                <ListRow
                  key={d.issue}
                  icon={KIND_ICON[d.kind]}
                  iconTone={tab === "Escalated" ? "blocked" : "card"}
                  title={d.issue}
                  subtitle={`${d.client} · ${DECISION_KIND_LABEL[d.kind]}`}
                  onClick={d.id && onOpen && tab !== "Overturned" ? () => onOpen(d.id!) : undefined}
                  right={
                    <>
                      {d.status === "proposed" && (
                        <Chip size="sm" tone="accent">
                          Proposed
                        </Chip>
                      )}
                      {d.status === "approved" && (
                        <Chip size="sm" tone="done">
                          Approved
                        </Chip>
                      )}
                      <span className="whitespace-nowrap font-semibold">AED {aed(d.amount)}</span>
                      <ConfidenceBar value={d.confidence} />
                      <span className="w-20 whitespace-nowrap text-right text-[13px] text-muted">{d.ago}</span>
                    </>
                  }
                />
              ))}
            </div>
          ) : (
            <Empty>{EMPTY_QUEUE[tab]}</Empty>
          )}
          <div className="flex items-center justify-between gap-4">
            <span className="text-[12px] text-faint">J / K to move · Enter to open</span>
            {more && (
              <PillButton size="sm" variant="secondary">
                Load more
              </PillButton>
            )}
          </div>
        </AppCard>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Period close                                                        */
/* ------------------------------------------------------------------ */

const adjustmentsText = (n: number) => (n === 0 ? "no proposed adjustments" : `${n} proposed ${n === 1 ? "adjustment" : "adjustments"}`);

export function CloseScreen({ onReview, view = INITIAL_VIEW }: { onReview: (key: string) => void; view?: View }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <AppCard title="Ready for sign-off" className="col-span-6">
        <div className="flex flex-col gap-2">
          {periodsReady.map((p) => (
            <ListRow
              key={p.client}
              icon={CalendarCheck}
              iconTone="review"
              title={p.client}
              subtitle={`${p.month} · ${adjustmentsText(p.adjustments)}`}
              right={
                <PillButton size="sm" onClick={() => onReview(p.client)}>
                  Review
                </PillButton>
              }
            />
          ))}
        </div>
      </AppCard>
      <AppCard title="In progress" className="col-span-6">
        <div className="flex flex-col gap-2">
          {view.periodsInProgress.map((p) => (
            <ListRow
              key={p.key}
              icon={CalendarClock}
              title={p.client}
              subtitle={`${p.month} · ${p.detail}`}
              right={
                <>
                  <Chip size="sm" tone={p.chip.tone}>
                    {p.chip.label}
                  </Chip>
                  {p.key === SG_NOVEMBER && (
                    <PillButton size="sm" onClick={() => onReview(p.key)} data-guide="review-sg">
                      Review
                    </PillButton>
                  )}
                </>
              }
            />
          ))}
        </div>
      </AppCard>
    </div>
  );
}

/**
 * A period's review: the engine's close checklist, the Sign-off card and oneth's proposed adjustments. The viewer
 * (Sara Malik) is a reviewer, and only partners sign off a period, so Sign off is disabled, as in the app; a month that
 * hasn't ended can't be signed off by anyone yet.
 */
export function PeriodReview({ period, onBack }: { period: PeriodView; onBack: () => void }) {
  const allDone = period.items.every((i) => i.status === "ok");
  return (
    <div className="flex flex-col gap-4">
      <PillButton size="sm" variant="secondary" onClick={onBack} className="self-start">
        <ArrowLeft {...ICON_SM} /> All periods
      </PillButton>
      <div className="grid grid-cols-12 gap-4">
        <AppCard
          title={`${period.client} · ${period.month}`}
          action={<Chip tone={period.chip.tone}>{period.chip.label}</Chip>}
          className="col-span-7 self-start"
          data-guide="checklist"
        >
          <ul className="flex flex-col gap-2">
            {period.items.map((item, i) => (
              <li key={item.label} className="flex min-h-[60px] items-center justify-between gap-4 rounded-app-tile bg-line-soft px-4 py-2.5">
                <span className="flex min-w-0 flex-col">
                  <span className="text-[14px] font-semibold leading-[20px]">{item.label}</span>
                  {item.detail && <span className="truncate text-[13px] leading-[18px] text-muted">{item.detail}</span>}
                </span>
                <Chip size="sm" tone={CHECKLIST_CHIP[item.status].tone} className={allDone ? "chip-pop" : ""}>
                  <span style={allDone ? { animationDelay: `${150 + i * 120}ms` } : undefined} className={allDone ? "chip-pop-inner" : ""}>
                    {CHECKLIST_CHIP[item.status].label}
                  </span>
                </Chip>
              </li>
            ))}
          </ul>
          {period.key === SG_NOVEMBER && period.nothingBlocking && (
            <p className="flex items-center gap-2 rounded-app-tile bg-ok-soft px-4 py-3 text-[14px] font-semibold leading-[20px] text-ok">
              <Check {...ICON_SM} /> Nothing blocking. Sign-off opens when {period.month.split(" ")[0]} ends.
            </p>
          )}
        </AppCard>
        <div className="col-span-5 flex min-w-0 flex-col gap-4">
          <AppCard title="Sign-off">
            <p className="text-[14px] leading-[20px] text-muted">
              Signing off locks {period.month} for {period.client}, including oneth&apos;s proposed adjustments. Nothing is posted to the
              accounting system.
            </p>
            <span aria-disabled className="inline-flex h-10 w-full items-center justify-center rounded-full bg-ink text-[14px] font-semibold text-white opacity-40">
              Sign off
            </span>
            {period.reason && <span className="text-[13px] leading-[18px] text-muted">{period.reason}</span>}
            <span className="flex items-center gap-2 text-[13px] leading-[18px] text-muted">
              <Lock {...ICON_SM} /> Only a partner can sign off a period.
            </span>
          </AppCard>
          <AppCard
            title="Proposed adjustments"
            action={
              period.adjustments.length ? (
                <Chip size="sm" tone="accent">
                  oneth proposed
                </Chip>
              ) : undefined
            }
          >
            {period.adjustments.length ? (
              <div className="flex flex-col gap-2">
                {period.adjustments.map((a) => (
                  <ListRow
                    key={a.description}
                    title={a.description}
                    subtitle={`Dr ${a.debit} · Cr ${a.credit}`}
                    right={<span className="whitespace-nowrap font-semibold">AED {aed(a.amount)}</span>}
                  />
                ))}
              </div>
            ) : (
              <Empty>No proposed adjustments for {period.month}.</Empty>
            )}
          </AppCard>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Knowledge                                                           */
/* ------------------------------------------------------------------ */

const clip = (s: string, n = 140) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

function KnowledgeRows({ tab, precedents }: { tab: KnowledgeTab; precedents: View["precedents"] }) {
  if (tab === "Policies")
    return policies.map((p) => <ListRow key={p.title} icon={ScrollText} title={p.title} subtitle={`${clip(p.body)} · Changed ${p.changed}`} />);
  if (tab === "Rules")
    return rules.map((r) => (
      <ListRow
        key={r.title}
        icon={BookOpen}
        title={r.title}
        subtitle={r.description}
        right={
          <>
            {!r.active && (
              <Chip size="sm" tone="review">
                Inactive
              </Chip>
            )}
            <Chip size="sm">v{r.version}</Chip>
          </>
        }
      />
    ));
  if (tab === "Supplier mappings")
    return supplierMappings.map((m) => (
      <ListRow
        key={m.supplier}
        icon={Building2}
        title={m.supplier}
        subtitle={`${m.code} ${m.account} · TRN ${formatTrn(m.trn)}`}
        right={<Chip size="sm">{m.vat}</Chip>}
      />
    ));
  return precedents.map((p) => (
    <ListRow
      key={p.pattern}
      icon={History}
      title={p.pattern}
      subtitle={`${p.summary} · ${p.date}`}
      right={
        <>
          <Chip size="sm">{p.scope}</Chip>
          <span className="w-16 text-right text-[13px] text-muted">Used {p.used}×</span>
        </>
      }
    />
  ));
}

export function KnowledgeScreen({ view = INITIAL_VIEW }: { view?: View }) {
  const [tab, setTab] = useState<KnowledgeTab>("Policies");
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <PillTabs items={KNOWLEDGE_TABS} active={tab} onSelect={setTab} />
        <span className="flex h-10 w-64 items-center gap-2 rounded-full bg-paper px-4 text-[14px] text-faint shadow-app">
          <Search {...ICON} className="shrink-0" />
          Search
        </span>
      </div>
      <AppCard
        title={tab}
        action={
          tab === "Policies" ? (
            <PillButton size="sm">
              <Plus {...ICON_SM} /> New policy
            </PillButton>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-2">
          <KnowledgeRows tab={tab} precedents={view.precedents} />
        </div>
      </AppCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Performance                                                         */
/* ------------------------------------------------------------------ */

/** Monotone cubic through the points (like the app's chart), so the line never overshoots between them. */
function monotonePath(pts: { x: number; y: number }[]) {
  const n = pts.length;
  if (n < 2) return "";
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    m[i] = (pts[i + 1].y - pts[i].y) / dx[i];
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  t[n - 1] = m[n - 2];
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${(pts[i].x + h).toFixed(1)} ${(pts[i].y + t[i] * h).toFixed(1)} ${(pts[i + 1].x - h).toFixed(1)} ${(pts[i + 1].y - t[i + 1] * h).toFixed(1)} ${pts[i + 1].x.toFixed(1)} ${pts[i + 1].y.toFixed(1)}`;
  }
  return d;
}

/**
 * Overturn rate over time: one blue line, hover for a day's value. The axis runs 0–20% so the trend is readable. The
 * line is drawn in a stretched 0–100 SVG box with non-scaling strokes; labels, the dot and the tooltip are HTML, so
 * text keeps its size at any card width.
 */
function OverturnChart({ points }: { points: { date: string; rate: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = 0.2;
  const last = points.length - 1;
  const x = (i: number) => (i / last) * 100;
  const y = (r: number) => (1 - r / max) * 100;
  const pts = points.map((p, i) => ({ x: x(i), y: y(p.rate) }));
  const ticks = [0.2, 0.1, 0];
  const labels = [0, Math.floor(last / 2), last];
  const h = hover === null ? null : { ...points[hover], ...pts[hover] };
  return (
    <div className="relative h-48 pb-6 pl-10 text-[12px] leading-[16px] text-faint">
      {ticks.map((r) => (
        <span key={r} className="absolute left-0 w-8 -translate-y-1/2 text-right tabular-nums" style={{ top: `calc((100% - 24px) * ${y(r) / 100})` }}>
          {Math.round(r * 100)}%
        </span>
      ))}
      <div className="relative h-full" onMouseLeave={() => setHover(null)}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden className="absolute inset-0 h-full w-full overflow-visible">
          {ticks.map((r) => (
            <line key={r} x1={0} x2={100} y1={y(r)} y2={y(r)} className="stroke-line-soft" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <path d={monotonePath(pts)} fill="none" className="stroke-accent" strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute inset-0 flex">
          {points.map((p, i) => (
            <span key={p.date} className="h-full flex-1" onMouseEnter={() => setHover(i)} />
          ))}
        </div>
        {h && (
          <>
            <span
              className="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-accent"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            />
            <span
              className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1 font-semibold text-white"
              style={{ left: `${Math.min(Math.max(h.x, 12), 88)}%`, top: `calc(${h.y}% - 36px)` }}
            >
              {h.date} · {Math.round(h.rate * 100)}% overturned
            </span>
          </>
        )}
      </div>
      {labels.map((i) => (
        <span
          key={i}
          className={`absolute bottom-0 whitespace-nowrap ${i === 0 ? "" : i === last ? "-translate-x-full" : "-translate-x-1/2"}`}
          style={{ left: `calc(2.5rem + (100% - 2.5rem) * ${x(i) / 100})` }}
        >
          {points[i].date}
        </span>
      ))}
    </div>
  );
}

export function PerformanceScreen() {
  const [range, setRange] = useState<PerformanceRange>("30 days");
  const p = performance[range];
  const note = "text-[13px] leading-[18px] text-muted";
  return (
    <div className="flex flex-col gap-4">
      <PillTabs items={PERFORMANCE_RANGES} active={range} onSelect={setRange} className="self-start" />
      <div className="grid grid-cols-12 gap-4">
        <AppCard title="Accuracy" className="col-span-8">
          <div className="grid grid-cols-3 gap-2">
            {p.accuracy.map((a) => (
              <StatTile key={a.label} label={a.label} value={pct(a.value)} />
            ))}
          </div>
          <p className={note}>
            Of the decisions reviewed from {p.from} to {p.to}, the share approved as oneth proposed them.
          </p>
        </AppCard>
        <AppCard title="Done within permissions" className="col-span-4">
          <StatTile surface="plain" size="hero" label="Autonomous completion" value={pct(p.autonomous)} />
          <p className={note}>Shadow mode: these were proposed, never applied.</p>
        </AppCard>
        <AppCard title="Overturn rate" className="col-span-8">
          <OverturnChart points={p.overturnRate} />
        </AppCard>
        <AppCard title="Value and time" className="col-span-4">
          <div className="flex flex-col gap-2">
            <StatTile label="Value of overturned decisions" value={`AED ${aed(p.overturnedValue)}`} />
            <StatTile label="Hours saved (estimate)" value={p.hoursSaved} />
          </div>
          <p className={note}>Six minutes for each decision a person didn&apos;t have to change.</p>
        </AppCard>
        <AppCard title="Recent overturns" className="col-span-12">
          <div className="flex flex-col gap-2">
            {p.overturned.map((o) => (
              <ListRow key={o.issue} icon={Undo2} title={o.issue} subtitle={`${o.client} · AED ${aed(o.amount)}`} />
            ))}
          </div>
        </AppCard>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

function PermissionsCard() {
  return (
    <AppCard title="Permissions">
      <p className="-mt-2 text-[13px] leading-[18px] text-muted">
        What oneth may decide on its own. Shadow mode: even an automatic decision is only proposed, and anything above the firm&apos;s
        materiality goes to a reviewer.
      </p>
      <div className="flex flex-col gap-2">
        {permissionSettings.map((p) => (
          <div key={p.label} className="flex items-center gap-4 rounded-app-tile bg-line-soft px-4 py-2.5">
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-2 text-[14px] font-semibold leading-[20px]">
                {p.label}
                {p.locked && <Lock {...ICON_SM} className="text-muted" />}
              </span>
              <span className="truncate text-[13px] leading-[18px] text-muted">{p.detail}</span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span
                className={`inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full bg-paper px-4 text-[13px] font-semibold ${p.locked ? "text-muted" : "text-ink"}`}
              >
                {PERMISSION_MODE_LABEL[p.mode]}
                <ChevronDown {...ICON_SM} className="text-muted" />
              </span>
              {p.threshold && (
                <span className="flex items-center gap-2 text-[13px] text-muted">
                  up to AED
                  <span className="inline-flex h-9 w-24 items-center rounded-app-tile bg-paper px-3 text-ink tabular-nums">{p.threshold}</span>
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
      <p className="text-right text-[13px] text-muted">Only a partner can change permissions.</p>
    </AppCard>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold leading-[18px] text-ink">{label}</span>
      <span className="flex h-10 items-center gap-2 rounded-app-tile bg-line-soft px-4 text-[14px] text-ink">{children}</span>
    </div>
  );
}

const APPEARANCE = ["System", "Light", "Dark"] as const;

function SettingsBody({ tab }: { tab: SettingsTab }) {
  const [appearance, setAppearance] = useState<(typeof APPEARANCE)[number]>("System");
  if (tab === "Permissions") return <PermissionsCard />;
  if (tab === "Team")
    return (
      <AppCard title="Team">
        <div className="flex flex-col gap-2">
          {team.map((m) => (
            <ListRow key={m.email} icon={User} title={m.name} subtitle={m.email} right={<Chip size="sm">{m.role}</Chip>} />
          ))}
        </div>
      </AppCard>
    );
  if (tab === "Branding")
    return (
      <AppCard title="Branding" className="max-w-[640px]">
        <div className="flex flex-col gap-4">
          <Field label="Firm name">{firm.name}</Field>
          <Field label="Logo (https:// address)">{branding.logo}</Field>
          <Field label="Portal colour">
            <span className="size-5 rounded-full bg-firm" />
            <span className="tabular-nums">{branding.colour}</span>
          </Field>
        </div>
        <PillButton className="self-start">Save branding</PillButton>
      </AppCard>
    );
  if (tab === "Integrations")
    return (
      <AppCard title="Integrations">
        <div className="flex flex-col gap-2">
          {integrations.map((i) => (
            <ListRow
              key={i.client}
              icon={Plug}
              title={`${i.client} · ${i.system}`}
              right={
                <Chip size="sm" tone={CONNECTION_TONE[i.connection]}>
                  {CONNECTION_LABEL[i.connection]}
                </Chip>
              }
            />
          ))}
        </div>
      </AppCard>
    );
  return (
    <AppCard title="Appearance" className="max-w-[640px]">
      <div role="radiogroup" aria-label="Appearance" className="grid grid-cols-3 gap-2">
        {APPEARANCE.map((a) => (
          <button
            key={a}
            type="button"
            role="radio"
            aria-checked={appearance === a}
            onClick={() => setAppearance(a)}
            className={`flex cursor-pointer items-center gap-3 rounded-app-tile px-4 py-4 text-left text-[14px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
              appearance === a ? "bg-accent-soft text-accent-ink" : "bg-line-soft text-ink hover:bg-line"
            }`}
          >
            <span className={`flex size-4 items-center justify-center rounded-full border-2 ${appearance === a ? "border-accent" : "border-faint"}`}>
              {appearance === a && <span className="size-2 rounded-full bg-accent" />}
            </span>
            {a}
          </button>
        ))}
      </div>
    </AppCard>
  );
}

export function SettingsScreen() {
  const [tab, setTab] = useState<SettingsTab>("Permissions");
  return (
    <div className="flex flex-col gap-4">
      <PillTabs items={SETTINGS_TABS} active={tab} onSelect={setTab} className="self-start" />
      <SettingsBody key={tab} tab={tab} />
    </div>
  );
}
