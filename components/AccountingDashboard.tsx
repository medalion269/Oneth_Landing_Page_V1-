import { Wordmark } from "./Brand";
import {
  IconBank,
  IconCalendarCheck,
  IconDoc,
  IconHome,
  IconMessage,
  IconPercent,
  IconPin,
  IconReview,
  IconSearch,
  IconSettings,
  IconUpload,
  IconUsers,
} from "./icons";
import { aed, dashboardClients, dashboardStats, firm, reviewQueue, vatReturn, type ClientStatus } from "@/lib/demo-data";

const statusPill: Record<ClientStatus, string> = {
  "In review": "pill-accent",
  "Ready to close": "pill-ok",
  "Waiting on client": "pill-warn",
  Closed: "pill-neutral",
};

const nav = [
  { label: "Overview", icon: IconHome, active: true },
  { label: "Review queue", icon: IconReview, badge: "14" },
  { label: "Reconciliation", icon: IconBank },
  { label: "Documents", icon: IconDoc },
  { label: "VAT returns", icon: IconPercent },
  { label: "Month-end close", icon: IconCalendarCheck },
  { label: "Clients", icon: IconUsers },
  { label: "Client requests", icon: IconMessage, badge: "5" },
];

function Avatar({ initials, className = "" }: { initials: string; className?: string }) {
  return (
    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#e6ecff] text-[10.5px] font-semibold text-accent-ink ${className}`}>
      {initials}
    </span>
  );
}

function Progress({ value, tone = "accent" }: { value: number; tone?: "accent" | "ok" | "warn" }) {
  const color = tone === "ok" ? "bg-ok" : tone === "warn" ? "bg-[#d97706]" : "bg-accent";
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
      <span className={`block h-full rounded-full ${color}`} style={{ width: `${Math.round(value * 100)}%` }} />
    </span>
  );
}

/** Full-screen product UI used in the hero (desktop). */
function FullDashboard() {
  return (
    <div
      data-dash-frame
      className="flex h-full w-full overflow-hidden rounded-[18px] border border-line bg-canvas text-[13px] text-ink shadow-float"
    >
      {/* Sidebar */}
      <aside className="flex w-[208px] shrink-0 xl:w-[236px] flex-col border-r border-line bg-paper px-3 py-4">
        <div className="flex items-center px-2">
          <Wordmark className="h-[22px]" />
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-lg border border-line px-2 py-1.5">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-ink text-[9.5px] font-semibold text-white">{firm.initials}</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12px] font-medium">{firm.name}</p>
            <p className="text-[10.5px] text-muted">18 active clients</p>
          </div>
        </div>
        <nav className="mt-5 space-y-0.5">
          {nav.map((n) => (
            <div
              key={n.label}
              className={`flex items-center gap-2.5 rounded-lg px-2 py-[7px] ${n.active ? "bg-canvas font-medium text-ink" : "text-muted"}`}
            >
              <n.icon size={16} />
              <span className="flex-1">{n.label}</span>
              {n.badge && <span className="rounded-full bg-accent-soft px-1.5 text-[10.5px] font-semibold text-accent-ink">{n.badge}</span>}
            </div>
          ))}
        </nav>
        <div className="mt-auto space-y-3 px-1">
          <div className="flex items-center gap-2 rounded-lg bg-canvas px-2.5 py-2 text-[11px] text-muted">
            <IconPin size={14} />
            <span>Data region: UAE</span>
          </div>
          <div className="flex items-center gap-2 px-1">
            <Avatar initials={firm.reviewerInitials} />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[12px] font-medium">{firm.reviewer}</p>
              <p className="text-[10.5px] text-muted">{firm.reviewerRole}</p>
            </div>
            <IconSettings size={15} className="ml-auto text-faint" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center gap-4 border-b border-line bg-paper/80 px-6">
          <p className="text-[13px] text-muted">
            Workspace <span className="mx-1 text-faint">/</span> <span className="font-medium text-ink">Overview</span>
          </p>
          <div className="ml-auto flex w-[260px] items-center gap-2 rounded-lg xl:w-[300px] border border-line bg-canvas px-3 py-1.5 text-[12px] text-faint">
            <IconSearch size={14} />
            Search clients, bills, transactions
            <span className="ml-auto rounded border border-line bg-paper px-1 text-[10px]">Ctrl K</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-[12px] font-medium text-white">
            <IconUpload size={14} /> Upload documents
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden p-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[20px] font-semibold tracking-[-0.025em]">Good morning, Sara</p>
              <p className="mt-0.5 text-muted">November 2026 books · 14 entries are ready for your review</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="pill pill-accent text-[11.5px]!">
                <span className="live-dot h-1.5 w-1.5 rounded-full bg-accent" /> Preparing 6 documents
              </span>
              <span className="rounded-lg border border-line bg-paper px-3 py-1.5 text-[12px] font-medium">November 2026</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {dashboardStats.map((s) => (
              <div key={s.label} className="rounded-xl border border-line bg-paper p-4 shadow-soft">
                <p className="text-[12px] text-muted">{s.label}</p>
                <p className="mt-1.5 text-[26px] font-semibold tracking-[-0.03em] tnum">
                  {s.value}
                  {s.suffix && <span className="ml-1 text-[14px] font-medium text-faint">{s.suffix}</span>}
                </p>
                {s.progress ? (
                  <div className="mt-2.5">
                    <Progress value={s.progress} />
                  </div>
                ) : (
                  <p className="mt-2 text-[11.5px] text-muted">{s.note}</p>
                )}
              </div>
            ))}
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-[1.6fr_1fr] gap-4">
            <div className="min-h-0 overflow-hidden rounded-xl border border-line bg-paper shadow-soft">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="font-semibold">Clients this month</p>
                <p className="text-[12px] text-muted">Sorted by items to review</p>
              </div>
              <div className="grid grid-cols-[1.7fr_0.6fr_1fr_1fr] xl:grid-cols-[1.8fr_0.6fr_0.7fr_1fr_1fr] gap-3 border-b border-line-soft px-4 py-2 text-[11.5px] text-muted">
                <span>Client</span>
                <span className="hidden text-right xl:block">Documents</span>
                <span className="whitespace-nowrap text-right">To review</span>
                <span>Reconciled</span>
                <span>Status</span>
              </div>
              {dashboardClients.map((c) => (
                <div key={c.name} className="grid grid-cols-[1.7fr_0.6fr_1fr_1fr] xl:grid-cols-[1.8fr_0.6fr_0.7fr_1fr_1fr] items-center gap-3 border-b border-line-soft px-4 py-[11px]">
                  <span className="truncate font-medium">{c.name}</span>
                  <span className="tnum hidden text-right text-muted xl:block">{c.docs}</span>
                  <span className={`tnum text-right ${c.toReview ? "font-medium text-accent-ink" : "text-faint"}`}>{c.toReview}</span>
                  <span className="flex items-center gap-2">
                    <Progress value={c.reconciled / 100} tone={c.reconciled === 100 ? "ok" : "accent"} />
                    <span className="tnum w-9 text-right text-[11.5px] text-muted">{c.reconciled}%</span>
                  </span>
                  <span>
                    <span className={`pill ${statusPill[c.status]} text-[11px]!`}>{c.status}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="flex min-h-0 flex-col gap-4">
              <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-line bg-paper shadow-soft">
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="font-semibold">Ready for review</p>
                  <span className="text-[12px] font-medium text-accent-ink">View all 14</span>
                </div>
                {reviewQueue.map((r, i) => (
                  <div key={r.party + r.kind} data-queue-item className={`flex items-center gap-3 px-4 py-[10px] ${i ? "border-t border-line-soft" : ""}`}>
                    <span className={`h-2 w-2 shrink-0 rounded-full ${r.tone === "warn" ? "bg-[#f59e0b]" : "bg-accent"}`} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="truncate font-medium">{r.party}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted">
                        {r.kind} · {r.note}
                      </p>
                    </div>
                    <span className="tnum text-[12.5px] font-medium">{aed(r.amount)}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-line bg-paper p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">VAT return {vatReturn.period}</p>
                  <span className="pill pill-neutral text-[11px]!">Due {vatReturn.due}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3 text-[11.5px]">
                  <div>
                    <p className="text-muted">Output VAT</p>
                    <p className="tnum mt-0.5 text-[13px] font-medium">{aed(vatReturn.output)}</p>
                  </div>
                  <div>
                    <p className="text-muted">Input VAT</p>
                    <p className="tnum mt-0.5 text-[13px] font-medium">{aed(vatReturn.input)}</p>
                  </div>
                  <div>
                    <p className="text-muted">Net payable</p>
                    <p className="tnum mt-0.5 text-[13px] font-semibold">{aed(vatReturn.net)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Readable, simplified product UI for phones and tablets. */
function CompactDashboard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-canvas text-[13px] text-ink shadow-lift">
      <div className="flex items-center gap-2 border-b border-line bg-paper px-4 py-3">
        <Wordmark className="h-[18px]" />
        <span className="ml-auto text-[12px] text-muted">November 2026</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 p-3">
        {dashboardStats.map((s) => (
          <div key={s.label} className="rounded-xl border border-line bg-paper p-3">
            <p className="text-[11.5px] text-muted">{s.label}</p>
            <p className="tnum mt-1 text-[20px] font-semibold tracking-[-0.03em]">
              {s.value}
              {s.suffix && <span className="ml-1 text-[12px] font-medium text-faint">{s.suffix}</span>}
            </p>
          </div>
        ))}
      </div>
      <div className="mx-3 mb-3 overflow-hidden rounded-xl border border-line bg-paper">
        <p className="border-b border-line px-3.5 py-2.5 font-semibold">Ready for review</p>
        {reviewQueue.slice(0, 3).map((r, i) => (
          <div key={r.party + r.kind} className={`flex items-center gap-2.5 px-3.5 py-2.5 ${i ? "border-t border-line-soft" : ""}`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${r.tone === "warn" ? "bg-[#f59e0b]" : "bg-accent"}`} />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate font-medium">{r.party}</p>
              <p className="mt-0.5 truncate text-[11.5px] text-muted">{r.kind}</p>
            </div>
            <span className="tnum text-[12.5px] font-medium">{aed(r.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AccountingDashboard({ variant = "full" }: { variant?: "full" | "compact" }) {
  return variant === "full" ? <FullDashboard /> : <CompactDashboard />;
}
