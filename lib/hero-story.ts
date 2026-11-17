/**
 * The hero's hands-on story: Saffron Grove's to-do list (components/hero-app).
 *
 * `World` is what the visitor has done so far and where they are in the app; `reduce` is pure (no timers, no clock),
 * so React's strict mode can run it twice; `select` turns the world into everything the screens show, so the counts on
 * every screen move together: Needs you, Awaiting review and the rail badge, the briefing, Clients, the queue tabs,
 * Work, precedents and Saffron Grove's November checklist (the engine's own rules and wording, backend/engine/close.py).
 */

import type { RailSection } from "@/components/app/ui";
import {
  CLOSE_MONTH,
  aed,
  client,
  closeChecklistDone,
  decisionQueue,
  invoice,
  listNames,
  needsYou,
  newPrecedent,
  nextInvoice,
  novemberFacts,
  overviewToday,
  periodReviews,
  periodsInProgress,
  portfolio,
  precedents,
  readyForSignoff,
  runningTasks,
  vatDeadlines,
  workTasks,
  alManaraLine,
  bazaarLine,
  type Adjustment,
  type DecisionTab,
  type ManaraBill,
  type NeedsRow,
  type QueueRow,
  type StoryId,
} from "./demo-data";

export type { StoryId, ManaraBill };

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export type Nav = { screen: RailSection; tab: DecisionTab; period: string | null; decision: StoryId | null };
export type PhoneStage = "hidden" | "question" | "typing" | "attached" | "sent";
export type ToastKind = "desert-approved" | "inv441-approved" | "sent" | "answered" | "bazaar-approved" | "manara-AMC-3391" | "manara-AMC-3402";

export type World = {
  nav: Nav;
  desert: "open" | "approved";
  inv441: "none" | "proposed" | "approved";
  /** The INV-0441 card was put away without confirming (it stays on the Auto-decided tab). */
  inv441Hidden: boolean;
  bazaar: "open" | "asked" | "answered" | "approved";
  phone: PhoneStage;
  manara: ManaraBill | null;
  toasts: { id: number; kind: ToastKind }[];
  nextToast: number;
  /** Guide beats the visitor has acknowledged with Next or Done. */
  acked: string[];
};

/** Saffron Grove's November period, as the Period close screen keys it. */
export const SG_NOVEMBER = "sg-nov";

export const INITIAL_WORLD: World = {
  nav: { screen: "overview", tab: "Awaiting review", period: null, decision: null },
  desert: "open",
  inv441: "none",
  inv441Hidden: false,
  bazaar: "open",
  phone: "hidden",
  manara: null,
  toasts: [],
  nextToast: 1,
  acked: [],
};

export type Action =
  | { type: "navigate"; to: RailSection; tab?: DecisionTab; period?: string | null; decision?: StoryId | null }
  | { type: "approve"; id: "desert" | "inv441" | "bazaar" }
  | { type: "inv441-arrives" }
  | { type: "hide-inv441" }
  | { type: "send-request" }
  | { type: "phone"; stage: PhoneStage }
  | { type: "client-answers" }
  | { type: "match"; bill: ManaraBill }
  | { type: "dismiss-toast"; id: number }
  | { type: "ack"; key: string }
  | { type: "reset" };

const toast = (w: World, kind: ToastKind): Pick<World, "toasts" | "nextToast"> => ({
  toasts: [...w.toasts, { id: w.nextToast, kind }].slice(-3),
  nextToast: w.nextToast + 1,
});

/** Pure and idempotent: every action checks the state it applies to. */
export function reduce(w: World, a: Action): World {
  switch (a.type) {
    case "navigate": {
      const decision = a.to === "decisions" ? (a.decision ?? null) : null;
      return {
        ...w,
        nav: {
          screen: a.to,
          tab: a.to === "decisions" ? (a.tab ?? (decision ? w.nav.tab : "Awaiting review")) : w.nav.tab,
          period: a.to === "close" ? (a.period ?? null) : null,
          decision,
        },
      };
    }
    case "approve":
      if (a.id === "desert" && w.desert === "open") return { ...w, desert: "approved", ...toast(w, "desert-approved") };
      if (a.id === "inv441" && w.inv441 === "proposed") return { ...w, inv441: "approved", ...toast(w, "inv441-approved") };
      if (a.id === "bazaar" && w.bazaar === "answered") return { ...w, bazaar: "approved", ...toast(w, "bazaar-approved") };
      return w;
    case "inv441-arrives":
      return w.desert === "approved" && w.inv441 === "none" ? { ...w, inv441: "proposed" } : w;
    case "hide-inv441":
      return w.inv441Hidden ? w : { ...w, inv441Hidden: true };
    case "send-request":
      return w.bazaar === "open" ? { ...w, bazaar: "asked", ...toast(w, "sent") } : w;
    case "phone":
      return w.bazaar === "asked" && w.phone !== a.stage ? { ...w, phone: a.stage } : w;
    case "client-answers":
      return w.bazaar === "asked" ? { ...w, bazaar: "answered", phone: "hidden", ...toast(w, "answered") } : w;
    case "match":
      return w.manara === null ? { ...w, manara: a.bill, ...toast(w, `manara-${a.bill}`) } : w;
    case "dismiss-toast":
      return w.toasts.some((t) => t.id === a.id) ? { ...w, toasts: w.toasts.filter((t) => t.id !== a.id) } : w;
    case "ack":
      return w.acked.includes(a.key) ? w : { ...w, acked: [...w.acked, a.key] };
    case "reset":
      return { ...INITIAL_WORLD, nextToast: w.nextToast };
  }
}

/** Open story decisions, in the order the to-do list takes them. */
export const STORY_ORDER: StoryId[] = ["desert", "bazaar", "manara"];
export const isOpen = (w: World, id: StoryId) =>
  id === "desert" ? w.desert === "open" : id === "bazaar" ? w.bazaar !== "approved" : w.manara === null;
export const nextOpen = (w: World): StoryId | null => STORY_ORDER.find((id) => isOpen(w, id)) ?? null;
export const storyDone = (w: World) => nextOpen(w) === null && w.inv441 !== "proposed";

/* ------------------------------------------------------------------ */
/* What the screens show                                               */
/* ------------------------------------------------------------------ */

export type ChecklistStatus = "ok" | "warning" | "blocked";
export const CHECKLIST_CHIP: Record<ChecklistStatus, { label: string; tone: "done" | "review" | "blocked" }> = {
  ok: { label: "Done", tone: "done" },
  warning: { label: "Check", tone: "review" },
  blocked: { label: "Blocked", tone: "blocked" },
};
export type ChecklistItem = { label: string; status: ChecklistStatus; detail: string | null };

/** A period's review page: checklist, status chip, sign-off reason and oneth's proposed adjustments. */
export type PeriodView = {
  key: string;
  client: string;
  month: string;
  chip: { label: string; tone: "done" | "review" | "blocked" | "progress" | "neutral" };
  items: ChecklistItem[];
  /** Why Sign off is not available yet (besides the viewer not being a partner). */
  reason: string | null;
  nothingBlocking: boolean;
  adjustments: Adjustment[];
};

const n = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** backend/engine/close.py checklist(), for the facts the hero tracks. */
function checklist(f: {
  documents: number;
  bankLines: number;
  bankUnmatched: number;
  bankUnmatchedTotal: number;
  decisions: number;
  escalated: number;
  awaiting: number;
  unconfirmed: number;
  evidenceOpen: number;
  vatOpen: number;
}): ChecklistItem[] {
  const reviewedParts = [f.awaiting ? `${f.awaiting} awaiting review` : "", f.escalated ? `${f.escalated} escalated` : ""].filter(Boolean);
  return [
    { label: "All documents processed", status: "ok", detail: `${n(f.documents, "document")} processed` },
    f.bankUnmatched
      ? { label: "Bank statement reconciled", status: "warning", detail: `${n(f.bankUnmatched, "bank line")} not matched (AED ${aed(f.bankUnmatchedTotal)})` }
      : { label: "Bank statement reconciled", status: "ok", detail: `All ${n(f.bankLines, "bank line")} matched or explained` },
    reviewedParts.length
      ? { label: "All decisions reviewed", status: "blocked", detail: reviewedParts.join(", ") }
      : f.unconfirmed
        ? { label: "All decisions reviewed", status: "warning", detail: `${n(f.unconfirmed, "auto-decided decision")} not yet confirmed by a person` }
        : { label: "All decisions reviewed", status: "ok", detail: `All ${n(f.decisions, "decision")} reviewed` },
    f.evidenceOpen
      ? { label: "No missing evidence", status: "blocked", detail: `${n(f.evidenceOpen, "item")} waiting for evidence from the client` }
      : { label: "No missing evidence", status: "ok", detail: null },
    f.vatOpen
      ? { label: "VAT workings prepared", status: "warning", detail: `${n(f.vatOpen, "decision")} affecting VAT still open` }
      : { label: "VAT workings prepared", status: "ok", detail: null },
  ];
}

/** Saffron Grove's November: the month is still running, so it is "In progress" and can't be signed off yet. */
function november(w: World): PeriodView {
  const items = checklist({
    documents: novemberFacts.documents + (w.inv441 !== "none" ? 1 : 0) + (w.bazaar === "answered" || w.bazaar === "approved" ? 1 : 0),
    bankLines: novemberFacts.bankLines,
    bankUnmatched: (w.bazaar !== "approved" ? 1 : 0) + (w.manara === null ? 1 : 0),
    bankUnmatchedTotal: (w.bazaar !== "approved" ? bazaarLine.amount : 0) + (w.manara === null ? alManaraLine.amount : 0),
    decisions: novemberFacts.decisions + (w.inv441 !== "none" ? 1 : 0),
    escalated: w.manara === null ? 1 : 0, // missing evidence is counted on its own line
    awaiting: w.desert === "open" ? 1 : 0,
    unconfirmed: w.inv441 === "proposed" ? 1 : 0,
    evidenceOpen: w.bazaar !== "approved" ? 1 : 0,
    vatOpen: (w.desert === "open" ? 1 : 0) + (w.bazaar !== "approved" ? 1 : 0) + (w.inv441 === "proposed" ? 1 : 0),
  });
  const blocked = items.filter((i) => i.status === "blocked").length;
  return {
    key: SG_NOVEMBER,
    client: client.name,
    month: novemberFacts.month,
    chip: blocked ? { label: `${blocked} blocked`, tone: "blocked" } : { label: "In progress", tone: "progress" },
    items,
    reason: blocked ? `Sign-off waits for ${n(blocked, "blocked checklist item")}.` : `${novemberFacts.month} hasn't ended yet.`,
    nothingBlocking: blocked === 0,
    adjustments: [],
  };
}

/** One of the four October periods ready for sign-off (unchanged by the story). */
export function readyPeriod(clientName: string): PeriodView | null {
  const r = periodReviews[clientName];
  if (!r) return null;
  return {
    key: clientName,
    client: clientName,
    month: CLOSE_MONTH,
    chip: { label: "Ready for sign-off", tone: "review" },
    items: closeChecklistDone(r).map((i) => ({ ...i, status: "ok" as const })),
    reason: null,
    nothingBlocking: true,
    adjustments: r.adjustments,
  };
}

const NEXT_ISSUE = `Classify ${invoice.supplierShort} invoice ${nextInvoice.number}`;

export function select(w: World) {
  const storyRows = needsYou.filter((r) => r.id && isOpen(w, r.id));
  const awaiting = overviewToday.awaitingReview - (w.desert === "approved" ? 1 : 0);
  const escalated = storyRows.filter((r) => r.state === "escalated").length;
  const tasksDone = overviewToday.tasksDone + (w.inv441 !== "none" ? 1 : 0) + (w.bazaar === "answered" || w.bazaar === "approved" ? 1 : 0);

  // Needs you: escalations, then the newest waiting; topped up from the queue as story rows clear
  const others = needsYou.filter((r) => !r.id);
  const extra: NeedsRow[] = decisionQueue["Awaiting review"]
    .filter((q) => !q.id && !others.some((o) => o.issue === q.issue))
    .map((q) => ({ kind: q.kind, state: "awaiting_review", issue: q.issue, client: q.client, amount: q.amount, confidence: q.confidence }));
  const needs = [...storyRows.filter((r) => r.state === "escalated"), ...storyRows.filter((r) => r.state !== "escalated"), ...others, ...extra].slice(0, 5);

  const firstEscalated = storyRows.find((r) => r.state === "escalated");
  const lead =
    firstEscalated?.id === "manara"
      ? `two open bills match AED ${aed(alManaraLine.amount)} to Al Manara Catering`
      : "a card payment at Bazaar Lane Online has no receipt";
  const briefing = [
    `I finished ${tasksDone} tasks today and am working on ${runningTasks.length} more.`,
    escalated
      ? `${n(escalated, "decision")} escalated and ${awaiting} waiting for review. Start with ${client.name}: ${lead}.`
      : `Nothing escalated. ${awaiting} decisions are waiting for review.`,
    `${readyForSignoff.length} periods are ready for sign-off: ${listNames(readyForSignoff.map((p) => p.client))}.`,
    `October VAT returns for ${vatDeadlines.length} clients are due in ${vatDeadlines[0].daysLeft} days (${vatDeadlines[0].due}).`,
  ];

  const clients = portfolio.map((c) => (c.name === client.name ? { ...c, openItems: storyRows.length } : c));

  const inv441Row: QueueRow[] =
    w.inv441 === "none"
      ? []
      : [{ kind: "classification", issue: NEXT_ISSUE, client: client.name, amount: nextInvoice.total, confidence: nextInvoice.confidence, ago: "Just now", status: w.inv441 === "approved" ? "approved" : "proposed" }];
  const queue: Record<Exclude<DecisionTab, "Precedents">, QueueRow[]> = {
    "Awaiting review": decisionQueue["Awaiting review"].filter((q) => !q.id || isOpen(w, q.id)),
    Escalated: decisionQueue.Escalated.filter((q) => !q.id || isOpen(w, q.id)),
    "Auto-decided": [...inv441Row, ...decisionQueue["Auto-decided"]],
    Overturned:
      w.manara === "AMC-3402"
        ? [{ ...decisionQueue.Escalated.find((q) => q.id === "manara")!, ago: "Just now" }, ...decisionQueue.Overturned]
        : decisionQueue.Overturned,
  };

  const justNow = (type: string, at: string) => ({ status: "done" as const, type, client: client.name, at: `17 Nov 2026, ${at}`, finished: `17 Nov 2026, ${at}` });
  const work = [
    ...workTasks.filter((t) => t.status !== "done"),
    ...(w.bazaar === "answered" || w.bazaar === "approved" ? [justNow("Process documents", "10:44")] : []),
    ...(w.inv441 !== "none" ? [justNow("Process documents", "10:41")] : []),
    ...workTasks.filter((t) => t.status === "done"),
  ];

  const prec =
    w.desert === "approved"
      ? [{ pattern: newPrecedent.pattern, summary: newPrecedent.summary, date: "17 Nov 2026", scope: newPrecedent.scope, used: w.inv441 !== "none" ? 1 : 0 }, ...precedents]
      : precedents;

  const nov = november(w);
  const inProgress = [
    ...periodsInProgress.filter((p) => p.client !== client.name).map((p) => ({ key: p.client, client: p.client, month: p.month, detail: p.detail, chip: { label: `${p.blocked} blocked`, tone: "blocked" as const } })),
    {
      key: SG_NOVEMBER,
      client: client.name,
      month: "Nov 2026",
      detail: nov.nothingBlocking ? "month still running" : nov.items.filter((i) => i.status === "blocked").map((i) => i.detail).join("; "),
      chip: nov.chip,
    },
  ];

  return {
    today: { tasksDone, tasksRunning: runningTasks.length, awaitingReview: awaiting, autoDecided: overviewToday.autoDecided, overturnRate: overviewToday.overturnRate },
    awaiting,
    escalated,
    needsYou: needs,
    briefing,
    portfolio: clients,
    queue,
    work,
    precedents: prec,
    periodsInProgress: inProgress,
    november: nov,
  };
}

export type View = ReturnType<typeof select>;
export const INITIAL_VIEW: View = select(INITIAL_WORLD);
