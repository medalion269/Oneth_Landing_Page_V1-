/*
 * The calculator's arithmetic (components/CapacityCheck.tsx). Pure: no DOM, no React.
 *
 * Time is counted in whole minutes and money in whole dirhams, so every figure is an integer until it is shown.
 * Routine work is recording sales invoices, purchase bills and bank lines (the part oneth prepares); the rest of a
 * client's month is VAT and the time the firm spends reviewing, answering questions and reporting.
 *
 * The visitor's guess of how much routine time would go is theirs: the page never fills it in (no time-saving claims).
 * Extra clients are served by the same team, so their fees are extra profit (before software costs); the calculator
 * never needs the firm's costs.
 */

export type ClientSize = "small" | "medium" | "large";

export type Firm = {
  /** People who do client work */
  people: number;
  clients: number;
  /** Average fee per client a month, AED */
  fee: number;
  /** What a typical client's month looks like */
  size: ClientSize;
};

/** Time per task. Starting points, shown on the page under the calculator. */
export const MINUTES_PER_SALES_INVOICE = 3;
export const MINUTES_PER_PURCHASE_BILL = 4;
export const MINUTES_PER_BANK_LINE = 1;
export const HOURS_PER_VAT_RETURN = 3;
/** Hours each person spends on client work a month */
export const CLIENT_HOURS_PER_PERSON = 120;
/** How full a team can comfortably run, in percent */
export const COMFORTABLY_FULL = 85;

/** A typical client's month by size: volumes, VAT period, and hours for review, questions and reporting. */
export const CLIENT_SIZES: Record<ClientSize, { label: string; salesInvoices: number; purchaseBills: number; bankLines: number; vatReturnsPerYear: number; otherHours: number }> = {
  small: { label: "Small", salesInvoices: 30, purchaseBills: 40, bankLines: 80, vatReturnsPerYear: 4, otherHours: 4 },
  medium: { label: "Medium", salesInvoices: 80, purchaseBills: 120, bankLines: 200, vatReturnsPerYear: 4, otherHours: 7 },
  large: { label: "Large", salesInvoices: 200, purchaseBills: 250, bankLines: 400, vatReturnsPerYear: 12, otherHours: 12 },
};

/** Invoices, bills and bank lines together, for the size picker's caption */
export const transactions = (size: ClientSize) => {
  const s = CLIENT_SIZES[size];
  return s.salesInvoices + s.purchaseBills + s.bankLines;
};

/** A fictional six-person firm, so the tool shows an answer before anyone types. */
export const EXAMPLE_FIRM: Firm = { people: 6, clients: 28, fee: 4_500, size: "medium" };

export type Month = {
  /** Team totals, minutes a month */
  routine: number;
  other: number;
  used: number;
  available: number;
  /** used / available, whole percent */
  fullPercent: number;
  /** More clients like the typical one the team can take before passing "comfortably full" */
  room: number;
};

export type WhatIf = Month & {
  /** Team minutes a month that would no longer go on routine work */
  freed: number;
  /** Clients the freed time makes room for, on top of the room the team has today */
  extraClients: number;
  /** Their fees a month: extra profit, since the team stays the same */
  extraFees: number;
};

const whole = (n: number) => (Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);

/** A client's routine minutes a month before any time is freed */
function routineMinutes(size: ClientSize) {
  const s = CLIENT_SIZES[size];
  return s.salesInvoices * MINUTES_PER_SALES_INVOICE + s.purchaseBills * MINUTES_PER_PURCHASE_BILL + s.bankLines * MINUTES_PER_BANK_LINE;
}

function month(firm: Firm, routinePerClient: number): Month {
  const s = CLIENT_SIZES[firm.size];
  const otherPerClient = Math.round((HOURS_PER_VAT_RETURN * 60 * s.vatReturnsPerYear) / 12) + s.otherHours * 60;
  const perClient = routinePerClient + otherPerClient;
  const routine = firm.clients * routinePerClient;
  const other = firm.clients * otherPerClient;
  const used = routine + other;
  // At least one person, so an emptied field reads as a very full team rather than an empty one
  const available = Math.max(1, firm.people) * CLIENT_HOURS_PER_PERSON * 60;
  const limit = Math.floor((available * COMFORTABLY_FULL) / 100);
  return {
    routine,
    other,
    used,
    available,
    fullPercent: Math.round((used * 100) / available),
    room: whole((limit - used) / perClient),
  };
}

/** The firm's month as it is today. */
export function today(firm: Firm): Month {
  return month(firm, routineMinutes(firm.size));
}

/**
 * The same month if `percent` of the routine time went (the visitor's own guess), with the freed hours spent on new
 * clients like the typical one, at the average fee. Same team, same payroll.
 */
export function withFreedTime(firm: Firm, percent: number): WhatIf {
  const now = today(firm);
  const p = Math.min(100, Math.max(0, percent));
  const after = month(firm, Math.round((routineMinutes(firm.size) * (100 - p)) / 100));
  // Only what the freed time adds: room the team already has today is not the guess's doing (a 0% guess gains nothing)
  const extraClients = Math.max(0, after.room - now.room);
  return { ...after, freed: now.used - after.used, extraClients, extraFees: extraClients * firm.fee };
}

/** A no-break space: keeps "AED" and its amount on one line */
export const NBSP = String.fromCharCode(160);

/** "1,234" */
export const group = (n: number) => Math.round(n).toLocaleString("en-US");
/** Whole hours from minutes */
export const hours = (minutes: number) => Math.round(minutes / 60);

const clientsWord = (n: number) => (n === 1 ? "client" : "clients");

/** The answer in one sentence, for the results screen and the PDF. */
export function headline(firm: Firm, estimate: number) {
  const after = withFreedTime(firm, estimate);
  const lead = `With a ${estimate}% time saving, your team`;
  // No-break spaces keep each amount on one line
  const aed = (n: number) => `AED${NBSP}${group(n)}`;
  if (after.extraClients > 0) {
    return `${lead} could take ${group(after.extraClients)} more ${clientsWord(after.extraClients)}, adding ${aed(after.extraFees)} a month to your profit (${aed(after.extraFees * 12)} a year), without hiring.`;
  }
  return `${lead} would get back ${group(hours(after.freed))} hours a month. That is not yet room for another client like your typical one.`;
}

/** How full the team is today, in words */
export function todayLine(firm: Firm) {
  const now = today(firm);
  if (now.fullPercent > 100) return `Your team needs ${now.fullPercent}% of its hours: more work than it has time for.`;
  if (now.fullPercent > COMFORTABLY_FULL) {
    return `Your team uses ${now.fullPercent}% of its client hours, past the ${COMFORTABLY_FULL}% where a team is comfortably full. No room for another client.`;
  }
  return `Your team uses ${now.fullPercent}% of its client hours, with room for ${group(now.room)} more ${clientsWord(now.room)} before passing ${COMFORTABLY_FULL}%.`;
}
