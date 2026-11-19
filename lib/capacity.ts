/*
 * The calculator's arithmetic (components/CapacityCheck.tsx). Pure: no DOM, no React.
 *
 * Three answers from the firm (docs/DECISIONS.md, L18): accountants, clients and the average fee. Everything else is
 * filled in, in the order the user drew it on a whiteboard (L16): the team's hours a month (accountants × a typical UAE
 * office week), each client's share of them (team hours ÷ clients: the team is busy with the clients it has), each
 * client's time with oneth (about ONETH_ESTIMATE percent less, L17), and so how many clients the same hours could
 * handle. Their fees are the extra revenue with the same team.
 *
 * Time is counted in whole minutes and money in whole dirhams, so every figure is an integer until it is shown.
 */

export type Firm = {
  accountants: number;
  clients: number;
  /** Average fee per client a month, AED */
  fee: number;
};

/**
 * oneth's estimate of the share of a client's month it takes off, in percent. Not measured yet, and the page says so.
 * From the UAE market validation report (18 Nov 2026): a tool that leaves the keying with the firm, as version 1 does in
 * shadow mode, removes about 8.5 to 30% of the routine work, and routine work is roughly half to two thirds of a
 * client's month, so about 5 to 20% of the whole. 15 sits in the upper part of that range (docs/DECISIONS.md, L17).
 * Change it here only: the page, the PDF and the firm's email all read it.
 */
export const ONETH_ESTIMATE = 15;

/** Hours an accountant works a week: a typical UAE office week (9 hours, 5 days). Ours, not the visitor's (L18). */
export const HOURS_PER_WEEK = 45;

/** What each answer accepts, shared by the form and the server's validation */
export const LIMITS = {
  accountants: { min: 1, max: 500 },
  clients: { min: 1, max: 5_000 },
  fee: { min: 1, max: 9_999_999 },
} as const;

/** Minutes a month for each hour worked a week: 60 minutes, 52 weeks, 12 months */
const MONTH_MINUTES_PER_WEEKLY_HOUR = (60 * 52) / 12;

export type Capacity = {
  /** The team's minutes a month */
  team: number;
  /** Minutes each client takes a month, today and with oneth */
  perClient: number;
  perClientAfter: number;
  /** Clients today (the visitor's answer), and how many the same hours could handle with oneth */
  clients: number;
  clientsAfter: number;
  more: number;
  /** Their fees a month, and the difference: the extra revenue, same team */
  revenue: number;
  revenueAfter: number;
  moreRevenue: number;
};

/** The firm's month today, and with oneth taking `estimate` percent off each client's time. */
export function capacity(firm: Firm, estimate = ONETH_ESTIMATE): Capacity {
  const p = Math.min(90, Math.max(0, Math.round(estimate)));
  const clients = Math.max(1, firm.clients);
  const team = Math.max(1, firm.accountants) * HOURS_PER_WEEK * MONTH_MINUTES_PER_WEEKLY_HOUR;
  // Each client's share of the team's hours, rounded down so the gain is never overstated
  const perClient = Math.max(1, Math.floor(team / clients));
  const perClientAfter = Math.max(1, Math.round((perClient * (100 - p)) / 100));
  // Whole clients only: a client the hours can't fully cover isn't counted
  const clientsAfter = Math.max(clients, Math.floor(team / perClientAfter));
  const fee = Math.max(0, firm.fee);
  return {
    team,
    perClient,
    perClientAfter,
    clients,
    clientsAfter,
    more: clientsAfter - clients,
    revenue: clients * fee,
    revenueAfter: clientsAfter * fee,
    moreRevenue: (clientsAfter - clients) * fee,
  };
}

/** A no-break space: keeps "AED" and its amount on one line */
export const NBSP = String.fromCharCode(160);

/** "1,234" */
export const group = (n: number) => Math.round(n).toLocaleString("en-US");
/** Hours from minutes, to one decimal where needed: "1,170", "41.8" */
export const hours = (minutes: number) => (minutes / 60).toLocaleString("en-US", { maximumFractionDigits: 1 });

export const clientsWord = (n: number) => (n === 1 ? "client" : "clients");
export const accountantsWord = (n: number) => (n === 1 ? "accountant" : "accountants");

/** The answer in one sentence, for the results screen and the PDF. */
export function headline(firm: Firm, estimate = ONETH_ESTIMATE) {
  const c = capacity(firm, estimate);
  const lead = `With oneth taking about ${estimate}% off each client's time`;
  // No-break spaces keep each amount on one line
  const aed = (n: number) => `AED${NBSP}${group(n)}`;
  const team = firm.accountants === 1 ? "your accountant" : `your ${group(firm.accountants)} accountants`;
  if (c.more > 0) {
    return `${lead}, ${team} could handle ${group(c.clientsAfter)} clients instead of ${group(c.clients)}: ${group(c.more)} more, adding ${aed(c.moreRevenue)} a month in fees (${aed(c.moreRevenue * 12)} a year), without hiring.`;
  }
  return `${lead}, a client would take ${hours(c.perClientAfter)} hours a month instead of ${hours(c.perClient)}. That frees ${hours(c.clients * (c.perClient - c.perClientAfter))} hours a month, not yet room for another client.`;
}

export type Step = { label: string; sum: string; result: string; oneth?: boolean };

/** The sums behind the answer, in the whiteboard's order: team hours, hours per client, the same with oneth, clients. */
export function workings(firm: Firm, estimate = ONETH_ESTIMATE): Step[] {
  const c = capacity(firm, estimate);
  const accountants = Math.max(1, firm.accountants);
  return [
    { label: "Your team", sum: `${group(accountants)} ${accountantsWord(accountants)} × ${HOURS_PER_WEEK} h a week`, result: `${hours(c.team)} h a month` },
    { label: "Each client today", sum: `${hours(c.team)} h ÷ ${group(c.clients)} ${clientsWord(c.clients)}`, result: `${hours(c.perClient)} h a month` },
    { label: "Each client with oneth", sum: `about ${estimate}% less time`, result: `${hours(c.perClientAfter)} h a month`, oneth: true },
    { label: "Clients with oneth", sum: `${hours(c.team)} h ÷ ${hours(c.perClientAfter)} h a client`, result: `${group(c.clientsAfter)} ${clientsWord(c.clientsAfter)}`, oneth: true },
  ];
}
