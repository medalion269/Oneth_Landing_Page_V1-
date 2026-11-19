/*
 * The calculator's arithmetic (components/CapacityCheck.tsx). Pure: no DOM, no React.
 *
 * Three answers from the firm (docs/DECISIONS.md, L18): accountants, clients and the average fee. Everything else is
 * filled in, in the order the user drew it on a whiteboard (L16): the team's hours a month (accountants × a typical UAE
 * office week), each client's share of them (team hours ÷ clients: the team is busy with the clients it has), each
 * client's time with oneth (about ONETH_ESTIMATE percent less, L26), and so how many clients the same hours could
 * handle. Their fees are the extra revenue with the same team.
 *
 * Time is counted in hundredths of an hour and money in whole dirhams, so every figure is an integer until it is shown.
 * Hours are shown to two decimals, so the sums on screen and in the PDF can be checked by hand (L26).
 */

export type Firm = {
  accountants: number;
  clients: number;
  /** Average fee per client a month, AED */
  fee: number;
};

/**
 * A client's month, task by task: each task's share of the month and how much of it oneth takes off, both in whole
 * percent. These are oneth's estimates (the user, 20 Nov 2026; docs/DECISIONS.md, L26), always labelled as estimates.
 * Name only work oneth does in the pilot: it reads, checks, codes, matches, asks and prepares, and the team approves,
 * keys and files. The PDF shows the rows, and ONETH_ESTIMATE is their sum, so the two always agree.
 */
export type Task = {
  /** The work, as an accountant would name it */
  work: string;
  /** What oneth does with it */
  oneth: string;
  /** Share of a client's month, percent; the shares add up to 100 */
  share: number;
  /** How much of that task's time oneth takes off, percent */
  cut: number;
};

export const TASKS: readonly Task[] = [
  { work: "Invoices and bills", oneth: "Read, VAT-checked and coded, ready for your approval", share: 35, cut: 50 },
  { work: "Bank reconciliation", oneth: "Bank lines matched to invoices and bills", share: 20, cut: 40 },
  { work: "Missing documents", oneth: "Asked for in the client's own portal", share: 10, cut: 25 },
  { work: "VAT return", oneth: "Figures prepared and checked for your team to file", share: 10, cut: 20 },
  { work: "Review, advice and client calls", oneth: "Stays with your team", share: 25, cut: 0 },
];

/**
 * oneth's estimate of the share of a client's month it takes off, in percent: 30 with the rows above
 * (17.5 + 8 + 2.5 + 2). The user asked for a higher figure than L17's 15 that still sounds believable (L26). 30% less
 * time per client means about 43% more clients for the same hours, under the 55% increase in weekly client support
 * that a 2025 Stanford and MIT study found among accountants using AI (STUDY below). Change the rows, not this line:
 * the page, the PDF and the firm's email all read it.
 */
export const ONETH_ESTIMATE = Math.round(TASKS.reduce((sum, t) => sum + t.share * t.cut, 0) / 100);

/** The one outside figure we quote, verbatim from the paper's abstract (checked 20 Nov 2026, L26). */
export const STUDY = {
  finding: "a 55% increase in weekly client support",
  who: "accountants using AI",
  source: "Choi and Xie, Stanford GSB working paper",
} as const;

/** Hours an accountant works a week: a typical UAE office week (9 hours, 5 days). Ours, not the visitor's (L18). */
export const HOURS_PER_WEEK = 45;

/** What each answer accepts, shared by the form and the server's validation */
export const LIMITS = {
  accountants: { min: 1, max: 500 },
  clients: { min: 1, max: 5_000 },
  fee: { min: 1, max: 9_999_999 },
} as const;

/** Hours a month for each hour worked a week: 52 weeks ÷ 12 months */
const MONTH_PER_WEEKLY_HOUR = 52 / 12;

/** One accountant's hours a month: 195 at 45 hours a week */
export const HOURS_A_MONTH_EACH = HOURS_PER_WEEK * MONTH_PER_WEEKLY_HOUR;

export type Capacity = {
  /** The team's time a month, in hundredths of an hour */
  team: number;
  /** Time each client takes a month, today and with oneth, in hundredths of an hour */
  perClient: number;
  perClientAfter: number;
  /** The time oneth gives back a month across today's clients, in hundredths of an hour: the same gain, kept as time */
  freed: number;
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
  const team = Math.round(Math.max(1, firm.accountants) * HOURS_A_MONTH_EACH * 100);
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
    freed: clients * (perClient - perClientAfter),
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
/** Hours from hundredths of an hour, to two decimals where needed: "1,170", "2.34", "41.79" */
export const hours = (hundredths: number) => (hundredths / 100).toLocaleString("en-US", { maximumFractionDigits: 2 });

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
  return `${lead}, a client would take ${hours(c.perClientAfter)} hours a month instead of ${hours(c.perClient)}. That frees ${hours(c.freed)} hours a month, not yet room for another client.`;
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
