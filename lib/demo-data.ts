/**
 * Demonstration data for the product mockups.
 *
 * Every company, person and tax registration number below is fictional.
 * Amounts are derived in code so the same invoice reads identically in the
 * document, dashboard, reconciliation and approval scenes, and VAT is always
 * exactly 5% of the net amount.
 */

export const VAT_RATE = 0.05;

const round2 = (n: number) => Math.round(n * 100) / 100;
export const vatOn = (net: number) => round2(net * VAT_RATE);
/** Split a VAT-inclusive total into net and VAT (used for receipts). */
export const splitGross = (gross: number) => {
  const net = round2(gross / (1 + VAT_RATE));
  return { net, vat: round2(gross - net), gross };
};

/** "3727.5" -> "3,727.50". Deterministic on server and client. */
export function aed(n: number): string {
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n < 0 ? "-" : ""}${grouped}.${dec}`;
}

/** "100234567890003" -> "100 2345 6789 0003" */
export const formatTrn = (trn: string) => trn.replace(/^(\d{3})(\d{4})(\d{4})(\d{4})$/, "$1 $2 $3 $4");

/* ------------------------------------------------------------------ */
/* People and companies                                                 */
/* ------------------------------------------------------------------ */

export const firm = {
  name: "Rahman & Co. Accountants",
  initials: "RC",
  reviewer: "Sara Malik",
  reviewerRole: "Senior accountant",
  reviewerInitials: "SM",
  /** Only partners sign off a period (the app disables Sign off for everyone else). */
  partner: "Aisha Rahman",
  partnerInitials: "AR",
};

export const client = {
  name: "Saffron Grove Restaurants LLC",
  short: "Saffron Grove",
  trn: "100987654300003",
  contact: "Omar",
  /** The contact's full name, as the portal and the audit trail show it. */
  contactName: "Omar Haddad",
  account: "4021",
};

/* ------------------------------------------------------------------ */
/* The featured supplier invoice                                        */
/* ------------------------------------------------------------------ */

const invoiceLines = [
  { description: "A4 copy paper, 80gsm, box of 5 reams", qty: 40, unitPrice: 32.5 },
  { description: "Laser toner cartridge, black", qty: 6, unitPrice: 285 },
  { description: "Mesh desk organiser", qty: 12, unitPrice: 45 },
].map((l) => ({ ...l, amount: round2(l.qty * l.unitPrice) }));

const invoiceNet = round2(invoiceLines.reduce((s, l) => s + l.amount, 0));
const invoiceVat = vatOn(invoiceNet);

export const invoice = {
  supplier: "Desert Line Office Supplies LLC",
  supplierShort: "Desert Line Office Supplies",
  supplierAddress: "Warehouse 14, Al Quoz Industrial Area 3, Dubai",
  supplierTrn: "100234567890003",
  number: "INV-2026-0418",
  file: "INV-2026-0418.pdf",
  date: "03 Nov 2026",
  due: "03 Dec 2026",
  terms: "30 days",
  lines: invoiceLines,
  net: invoiceNet, // 3,550.00
  vat: invoiceVat, // 177.50
  total: round2(invoiceNet + invoiceVat), // 3,727.50
  paidOn: "05 Nov 2026",
};

/** The journal the platform prepares from the invoice. */
export const preparedEntry = {
  type: "Supplier bill",
  vatTreatment: "Standard rated, 5%",
  lines: [
    { code: "6120", account: "Office supplies", debit: invoice.net, credit: 0 },
    { code: "1450", account: "Input VAT recoverable", debit: invoice.vat, credit: 0 },
    { code: "2010", account: "Accounts payable, Desert Line", debit: 0, credit: invoice.total },
  ],
  preparedAt: "05 Nov 2026, 09:12",
  approvedAt: "05 Nov 2026, 14:32",
};

/* ------------------------------------------------------------------ */
/* Other source documents                                               */
/* ------------------------------------------------------------------ */

const receiptGross = 412.8;
export const receipt = {
  merchant: "FreshMart JLT",
  location: "Cluster D, Jumeirah Lake Towers",
  number: "88213",
  date: "06 Nov 2026",
  time: "18:42",
  items: [
    { name: "Basmati rice 10kg", amount: 168.0 },
    { name: "Olive oil 5L x2", amount: 139.9 },
    { name: "Cleaning supplies", amount: 104.9 },
  ],
  ...splitGross(receiptGross), // net 393.14, vat 19.66, gross 412.80
};

export const clientUpload = {
  file: "Saffron_Grove_Nov_uploads.pdf",
  pages: 12,
  uploadedBy: "Omar, Saffron Grove",
  uploadedAt: "07 Nov 2026",
};

/* ------------------------------------------------------------------ */
/* Bank reconciliation                                                  */
/* ------------------------------------------------------------------ */

const facilities = 2184.35; // net 2,080.33 + VAT 104.02
const catering = 6250.0; // net 5,952.38 + VAT 297.62
const salesNet = 18000;

export type MatchState = "matched" | "review" | "missing";

export const bankTransactions = [
  { id: "b1", date: "05 Nov", description: "TRF DESERT LINE OFFICE SUP", amount: -invoice.total, state: "matched" as MatchState },
  { id: "b2", date: "06 Nov", description: "POS FRESHMART JLT", amount: -receipt.gross, state: "matched" as MatchState },
  { id: "b3", date: "07 Nov", description: "INWARD TRF MARINA EVENTS FZ", amount: salesNet + vatOn(salesNet), state: "matched" as MatchState },
  { id: "b4", date: "09 Nov", description: "TRF MARINA HEIGHTS FM", amount: -facilities, state: "matched" as MatchState },
  { id: "b5", date: "11 Nov", description: "TRF AL MANARA CATERING", amount: -catering, state: "review" as MatchState },
  { id: "b6", date: "12 Nov", description: "CARD 4021 BAZAAR LANE ONLINE", amount: -1149.0, state: "missing" as MatchState },
];

/** Open documents in final (aligned) order. `shuffledIndex` is where each row starts before it aligns. */
export const openItems = [
  { id: "d1", ref: invoice.number, party: invoice.supplierShort, kind: "Bill", amount: invoice.total, matches: "b1", shuffledIndex: 3 },
  { id: "d2", ref: `RCPT ${receipt.number}`, party: receipt.merchant, kind: "Receipt", amount: receipt.gross, matches: "b2", shuffledIndex: 0 },
  { id: "d3", ref: "SI-1027", party: "Marina Events FZ-LLC", kind: "Sales invoice", amount: salesNet + vatOn(salesNet), matches: "b3", shuffledIndex: 5 },
  { id: "d4", ref: "MHF-1184", party: "Marina Heights Facilities", kind: "Bill", amount: facilities, matches: "b4", shuffledIndex: 1 },
  { id: "d5", ref: "AMC-3391", party: "Al Manara Catering", kind: "Bill", amount: catering, matches: "b5", shuffledIndex: 4 },
  { id: "d6", ref: "AMC-3402", party: "Al Manara Catering", kind: "Bill", amount: catering, matches: "b5", shuffledIndex: 2 },
];

export const reviewItems = [
  {
    id: "r1",
    tone: "review" as const,
    title: `AED ${aed(catering)} to Al Manara Catering`,
    detail: "Two open bills have the same amount (AMC-3391 and AMC-3402). Choose the one this payment settles.",
    action: "Choose bill",
  },
  {
    id: "r2",
    tone: "missing" as const,
    title: "AED 1,149.00 card payment to Bazaar Lane Online",
    detail: `No receipt or invoice found. A request to ${client.contact} is drafted for you to send.`,
    action: "Review request",
  },
];

/* ------------------------------------------------------------------ */
/* The app's Overview (hero), with the fictional firm above             */
/* ------------------------------------------------------------------ */

export type DecisionKind = "classification" | "bank_match" | "vat_treatment" | "missing_evidence";
export type DecisionState = "escalated" | "awaiting_review" | "approved" | "overturned";

export const DECISION_STATE_LABEL: Record<DecisionState, string> = {
  escalated: "Escalated",
  awaiting_review: "Needs review",
  approved: "Approved",
  overturned: "Overturned",
};

/** "Today" on the Overview: what oneth did and what waits for people. */
/** What oneth is running right now (the app's Work in progress rows: task type · client, and its progress). */
export const runningTasks = [
  { type: "Reconcile bank", client: client.name, progress: 68 },
  { type: "Process documents", client: "Marina Events FZ-LLC", progress: 40 },
];

export const overviewToday = {
  tasksDone: 9,
  tasksRunning: runningTasks.length,
  awaitingReview: 14,
  autoDecided: 0.38,
  overturnRate: 0.06,
};

/** The three Saffron Grove decisions the hero's hands-on story works through (components/hero-app). */
export type StoryId = "desert" | "bazaar" | "manara";

export type NeedsRow = { id?: StoryId; kind: DecisionKind; state: DecisionState; issue: string; client: string; amount: number; confidence: number };

/**
 * "Needs you": escalations first, then the newest waiting for review. Saffron Grove's open decisions are exactly the
 * three story decisions, so finishing them leaves its November with nothing blocking. Amounts reuse the scenes below.
 */
export const needsYou: NeedsRow[] = [
  { id: "manara", kind: "bank_match", state: "escalated", issue: `Two open bills match AED ${aed(catering)} to Al Manara Catering`, client: client.name, amount: catering, confidence: 0.52 },
  { id: "bazaar", kind: "missing_evidence", state: "escalated", issue: "No receipt for card payment at Bazaar Lane Online", client: client.name, amount: 1149, confidence: 0.41 },
  { id: "desert", kind: "classification", state: "awaiting_review", issue: `Classify ${invoice.supplierShort} invoice ${invoice.number}`, client: client.name, amount: invoice.total, confidence: 0.94 },
  { kind: "classification", state: "awaiting_review", issue: "Record sales invoice SI-1027", client: "Marina Events FZ-LLC", amount: salesNet + vatOn(salesNet), confidence: 0.91 },
  { kind: "vat_treatment", state: "awaiting_review", issue: "VAT treatment for Coastline Print invoice CP-3110", client: "Blue Dhow Logistics LLC", amount: round2(2400 + vatOn(2400)), confidence: 0.86 },
];

/** "Decisions this week": per day, decided within permissions (auto) and reviewed by people. */
export const decisionsByDay = [
  { day: "Wed", auto: 3, reviewed: 4 },
  { day: "Thu", auto: 4, reviewed: 2 },
  { day: "Fri", auto: 2, reviewed: 3 },
  { day: "Sat", auto: 1, reviewed: 1 },
  { day: "Sun", auto: 4, reviewed: 3 },
  { day: "Mon", auto: 5, reviewed: 4 },
  { day: "Tue", auto: 3, reviewed: 2 },
];

export const readyForSignoff = [
  { client: "Marina Events FZ-LLC", month: "Oct 2026" },
  { client: "Al Sufouh Interiors LLC", month: "Oct 2026" },
  { client: "Palm Crest Dental Clinic", month: "Oct 2026" },
  { client: "Blue Dhow Logistics LLC", month: "Oct 2026" },
];

export const vatDeadlines = [
  { client: client.name, due: "28 Nov 2026", daysLeft: 11 },
  { client: "Blue Dhow Logistics LLC", due: "28 Nov 2026", daysLeft: 11 },
  { client: "Oasis Grid Engineering LLC", due: "28 Nov 2026", daysLeft: 11 },
  { client: "Marina Events FZ-LLC", due: "28 Nov 2026", daysLeft: 11 },
];

/** "A, B and C" */
export const listNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? ""));

/* ------------------------------------------------------------------ */
/* Approval evidence                                                    */
/* ------------------------------------------------------------------ */

/** Earlier bills from the same supplier that the firm coded to 6120 (the precedent). */
export const precedentBills = 9;

export const evidence = [
  {
    id: "lines",
    title: "Line items",
    body: "Copy paper, toner cartridges and desk organisers are office consumables.",
  },
  {
    id: "history",
    title: "Your team's history",
    body: `${precedentBills} earlier bills from this supplier were coded to 6120 Office supplies.`,
  },
  {
    id: "tax",
    title: "Tax invoice details",
    body: `Supplier TRN and 5% VAT of AED ${aed(invoice.vat)} are shown on the invoice.`,
  },
  {
    id: "bank",
    title: "Bank payment",
    body: `AED ${aed(invoice.total)} paid on ${invoice.paidOn} from account ending ${client.account}.`,
  },
];

export const explanation = `The items on this bill are office consumables, and your team coded the last ${precedentBills} bills from ${invoice.supplierShort} to Office supplies. The invoice is a tax invoice with a supplier TRN and 5% VAT, so the VAT is suggested as recoverable input tax.`;

/* ------------------------------------------------------------------ */
/* Knowledge: precedents, and the next bill that cites one              */
/* ------------------------------------------------------------------ */

/** The precedent saved when INV-2026-0418 was approved in Review, and older ones (the app's Precedents list). */
export const newPrecedent = {
  pattern: `${invoice.supplierShort} invoices`,
  summary: `Coded to ${preparedEntry.lines[0].code} ${preparedEntry.lines[0].account}, input VAT recoverable`,
  date: "05 Nov 2026",
  scope: "One client",
};

export const olderPrecedents = [
  { pattern: "Marina Heights Facilities bills", summary: "Coded to 6310 Facilities, input VAT recoverable", date: "21 Oct 2026", scope: "One client", used: 6 },
  { pattern: `${receipt.merchant} receipts`, summary: "Coded to 5110 Kitchen supplies, input VAT recoverable", date: "14 Oct 2026", scope: "One client", used: 11 },
  { pattern: "Bank charges under AED 50", summary: "Coded to 6810 Bank charges, no VAT", date: "30 Sep 2026", scope: "Firm-wide", used: 23 },
];

const nextNet = 1220;
/** The next bill from the same supplier: oneth proposes it citing the new precedent. VAT derived, as everywhere. */
export const nextInvoice = {
  number: "INV-2026-0441",
  date: "17 Nov 2026",
  net: nextNet,
  vat: vatOn(nextNet), // 61.00
  total: round2(nextNet + vatOn(nextNet)), // 1,281.00
  confidence: 0.97,
};

/* ------------------------------------------------------------------ */
/* Client portal: the client answers a question and sends the invoice  */
/* ------------------------------------------------------------------ */

const missingLine = bankTransactions.find((t) => t.state === "missing")!;

/**
 * The Bazaar Lane card payment that Reconcile could not explain. A person asked the client about it; the portal shows
 * the firm's message as the question, with the bank line under it (the backend's PortalQuestion). The client replies
 * with a photo; oneth reads it and proposes settling the line against it (pipeline/client_requests.propose_settlement).
 */
export const portalQuestion = {
  message: "What was this card payment for? Please send us the invoice.",
  line: { description: missingLine.description, date: "12 Nov 2026", amount: -missingLine.amount },
  /** The request's title in the firm app, as ask_client() writes it. */
  title: `A payment of AED ${aed(-missingLine.amount)} on 12 Nov 2026`,
  answer: "Folding chairs for the Marina branch terrace. Invoice attached.",
  photo: "IMG_4417.jpg",
  askedAt: "13 Nov 2026, 09:40",
  answeredAt: "14 Nov 2026, 18:22",
  reproposedAt: "14 Nov 2026, 18:23",
};

const chairs = 6;
/**
 * The invoice the client photographs: the online shop's A4 tax invoice that came folded in the parcel, paid by the card
 * on the bank line. The shop prices include VAT, so each line shows the taxable amount and the VAT backed out of it:
 * 6 × 191.50 = 1,149.00, of which 1,094.29 is taxable and 54.71 is VAT (5% of 1,094.29, rounded).
 */
export const bazaarInvoice = {
  brand: "Bazaar Lane",
  tagline: "Home & Outdoor",
  supplier: "Bazaar Lane Trading LLC",
  address: ["Unit 12, Al Quoz Industrial Area 2", "Dubai, United Arab Emirates"],
  trn: "100452177890003",
  number: "BL-INV-2611-0873",
  date: "12 Nov 2026",
  order: "Order BL-58204",
  deliverTo: "Saffron Grove, Marina branch",
  lines: [
    { item: "Folding chair, teak finish", sku: "40118", qty: chairs, unit: round2(-missingLine.amount / chairs), ...splitGross(-missingLine.amount) },
    { item: "Standard delivery, Dubai", sku: "DLV", qty: 1, unit: 0, net: 0, vat: 0, gross: 0 },
  ],
  ...splitGross(-missingLine.amount), // net 1,094.29, vat 54.71, gross 1,149.00
  card: client.account,
};

/** Another open request in the client's Communications tab: nothing uploaded yet, so it is still Waiting. */
export const openRequest = { title: "November bank statement", asked: "3 Nov 2026" };

/* ------------------------------------------------------------------ */
/* The hero's clickable app: the screens behind the rail               */
/* ------------------------------------------------------------------ */
/*
 * Labels, columns and chips follow the app's pages (frontend/src/app/*Page.tsx and frontend/src/lib). The people,
 * firms and amounts are fictional and agree with the Overview above: 14 decisions awaiting review plus 2 escalated
 * are the 16 open items across the portfolio, the 4 periods ready for sign-off are the Overview's, and so on.
 */

/** A relative time as the app writes it ("5 min ago", "3 h ago", "2 days ago"). Fixed strings here. */
type Ago = string;

export type ConnectionState = "connected" | "syncing" | "error" | "not_connected";
export const CONNECTION_LABEL: Record<ConnectionState, string> = {
  connected: "Connected",
  syncing: "Syncing",
  error: "Error",
  not_connected: "Not connected",
};

/** Clients → Portfolio. `openItems` are the decisions that wait for a person (awaiting review or escalated). */
export const portfolio: {
  name: string;
  trn: string | null;
  industry: string;
  system: "Zoho Books" | "Xero" | "TallyPrime" | "None";
  vatPeriod: "Monthly" | "Quarterly";
  connection: ConnectionState;
  openItems: number;
}[] = [
  { name: client.name, trn: client.trn, industry: "Restaurants", system: "Zoho Books", vatPeriod: "Monthly", connection: "connected", openItems: 3 },
  { name: "Marina Events FZ-LLC", trn: "100561238900003", industry: "Events", system: "Xero", vatPeriod: "Quarterly", connection: "syncing", openItems: 4 },
  { name: "Al Sufouh Interiors LLC", trn: "100778341200003", industry: "Interior design", system: "Zoho Books", vatPeriod: "Quarterly", connection: "connected", openItems: 2 },
  { name: "Palm Crest Dental Clinic", trn: "100342987600003", industry: "Healthcare", system: "TallyPrime", vatPeriod: "Quarterly", connection: "connected", openItems: 0 },
  { name: "Blue Dhow Logistics LLC", trn: "100915672300003", industry: "Logistics", system: "Xero", vatPeriod: "Monthly", connection: "connected", openItems: 3 },
  { name: "Oasis Grid Engineering LLC", trn: "100224589100003", industry: "Engineering", system: "None", vatPeriod: "Monthly", connection: "not_connected", openItems: 4 },
];

/** Work: one card per status, in the app's order. */
export type TaskStatus = "running" | "queued" | "blocked" | "failed" | "done";
export const TASK_GROUPS: { status: TaskStatus; title: string; empty: string }[] = [
  { status: "running", title: "Running", empty: "Nothing is running." },
  { status: "queued", title: "Queued", empty: "Nothing is waiting to start." },
  { status: "blocked", title: "Blocked", empty: "Nothing is blocked." },
  { status: "failed", title: "Failed", empty: "Nothing has failed." },
  { status: "done", title: "Done", empty: "Nothing finished yet." },
];

const oasisStatement = "No bank statement imported for October 2026"; // engine/close.py's wording

export const workTasks: { status: TaskStatus; type: string; client: string; at: string; finished?: string; progress?: number; blocker?: string }[] = [
  { status: "running", type: runningTasks[0].type, client: runningTasks[0].client, at: "17 Nov 2026, 09:14", progress: runningTasks[0].progress },
  { status: "running", type: runningTasks[1].type, client: runningTasks[1].client, at: "17 Nov 2026, 10:02", progress: runningTasks[1].progress },
  { status: "queued", type: "Prepare VAT", client: "Blue Dhow Logistics LLC", at: "17 Nov 2026, 10:05" },
  { status: "blocked", type: "Month-end close", client: "Oasis Grid Engineering LLC", at: "17 Nov 2026, 08:30", blocker: oasisStatement },
  // Done today: the Overview's "9 tasks", newest first
  { status: "done", type: "Investigate discrepancy", client: client.name, at: "17 Nov 2026, 08:41", finished: "17 Nov 2026, 08:44" },
  { status: "done", type: "Process documents", client: client.name, at: "17 Nov 2026, 07:40", finished: "17 Nov 2026, 08:05" },
  { status: "done", type: "Sync accounting", client: "Al Sufouh Interiors LLC", at: "17 Nov 2026, 06:00", finished: "17 Nov 2026, 06:03" },
  { status: "done", type: "Reconcile bank", client: "Blue Dhow Logistics LLC", at: "17 Nov 2026, 05:30", finished: "17 Nov 2026, 05:52" },
  { status: "done", type: "Month-end close", client: "Al Sufouh Interiors LLC", at: "17 Nov 2026, 05:00", finished: "17 Nov 2026, 05:06" },
  { status: "done", type: "Process documents", client: "Palm Crest Dental Clinic", at: "17 Nov 2026, 04:10", finished: "17 Nov 2026, 04:31" },
  { status: "done", type: "Sync accounting", client: "Blue Dhow Logistics LLC", at: "17 Nov 2026, 03:00", finished: "17 Nov 2026, 03:02" },
  { status: "done", type: "Process documents", client: "Oasis Grid Engineering LLC", at: "17 Nov 2026, 02:15", finished: "17 Nov 2026, 02:40" },
  { status: "done", type: "Sync accounting", client: "Palm Crest Dental Clinic", at: "17 Nov 2026, 01:00", finished: "17 Nov 2026, 01:03" },
];
if (workTasks.filter((t) => t.status === "done").length !== overviewToday.tasksDone) throw new Error("Work's Done list must match the Overview's tasks done today");

/** Decisions: the queue's tabs, type labels (frontend/src/lib/decisions.ts) and rows. */
export const DECISION_TABS = ["Awaiting review", "Escalated", "Auto-decided", "Overturned", "Precedents"] as const;
export type DecisionTab = (typeof DECISION_TABS)[number];

export const DECISION_KIND_LABEL: Record<DecisionKind, string> = {
  classification: "Classification",
  bank_match: "Bank match",
  vat_treatment: "VAT treatment",
  missing_evidence: "Missing evidence",
};

export type QueueRow = {
  id?: StoryId;
  kind: DecisionKind;
  issue: string;
  client: string;
  amount: number;
  confidence: number;
  ago: Ago;
  /** Auto-decided rows: still only proposed (shadow mode), or confirmed by a person. */
  status?: "proposed" | "approved";
};

const fromNeedsYou = (state: DecisionState, agos: Ago[]): QueueRow[] =>
  needsYou.filter((d) => d.state === state).map((d, i) => ({ id: d.id, kind: d.kind, issue: d.issue, client: d.client, amount: d.amount, confidence: d.confidence, ago: agos[i] }));

/** Decisions people overturned, newest first (amounts are net + 5% VAT). */
const overturnNets: (Omit<QueueRow, "amount"> & { net: number })[] = [
  { kind: "classification", issue: "Classify Harbour Tools invoice HT-2209", client: "Oasis Grid Engineering LLC", net: 2800, confidence: 0.71, ago: "3 days ago" },
  { kind: "vat_treatment", issue: "VAT treatment for Al Manara Catering bill AMC-3317", client: client.name, net: 1800, confidence: 0.74, ago: "9 days ago" },
  { kind: "bank_match", issue: "Match TRF GULF FREIGHT to bill GF-7741", client: "Blue Dhow Logistics LLC", net: 7000, confidence: 0.68, ago: "16 days ago" },
];
const overturns: QueueRow[] = overturnNets.map(({ net, ...row }) => ({ ...row, amount: round2(net + vatOn(net)) }));

export const decisionQueue: Record<Exclude<DecisionTab, "Precedents">, QueueRow[]> = {
  "Awaiting review": [
    ...fromNeedsYou("awaiting_review", ["3 h ago", "6 h ago", "1 day ago"]),
    { kind: "classification", issue: "Classify Gulf Breeze Cleaning invoice GBC-0552", client: "Al Sufouh Interiors LLC", amount: round2(1300 + vatOn(1300)), confidence: 0.89, ago: "1 day ago" },
    { kind: "classification", issue: "Classify Seaview Uniforms invoice SU-0219", client: "Marina Events FZ-LLC", amount: round2(2750 + vatOn(2750)), confidence: 0.9, ago: "2 days ago" },
    { kind: "classification", issue: "Classify Harbour Tools invoice HT-2231", client: "Oasis Grid Engineering LLC", amount: round2(4700 + vatOn(4700)), confidence: 0.92, ago: "2 days ago" },
  ],
  Escalated: fromNeedsYou("escalated", ["2 h ago", "1 day ago"]),
  // Shadow mode: what oneth decided within its permissions is only proposed, never applied.
  "Auto-decided": [
    { kind: "bank_match", issue: "Match TRF GULF FREIGHT to bill GF-7802", client: "Blue Dhow Logistics LLC", amount: round2(3000 + vatOn(3000)), confidence: 0.99, ago: "4 h ago", status: "proposed" },
    { kind: "bank_match", issue: "Match POS MEDISUPPLY DXB to receipt 5521", client: "Palm Crest Dental Clinic", amount: round2(400 + vatOn(400)), confidence: 0.98, ago: "4 h ago", status: "proposed" },
    { kind: "bank_match", issue: "Match INWARD TRF EXPO STAGING to SI-1019", client: "Marina Events FZ-LLC", amount: round2(12000 + vatOn(12000)), confidence: 0.99, ago: "5 h ago", status: "proposed" },
    { kind: "classification", issue: "Classify bank charge of 10 Nov 2026", client: "Blue Dhow Logistics LLC", amount: 26.25, confidence: 0.99, ago: "1 day ago", status: "proposed" },
  ],
  Overturned: overturns,
};

/** Precedents before the story; approving the Desert Line invoice adds one (lib/hero-story.ts). */
export const precedents: { pattern: string; summary: string; date: string; scope: string; used: number }[] = [...olderPrecedents];

/**
 * A period's review (the app's period detail, frontend/src/app/close/PeriodDetailPage.tsx): the engine's close checklist
 * (backend/engine/close.py wording), all done for the four ready periods, and oneth's proposed month-end adjustments.
 */
export type Adjustment = { description: string; amount: number; debit: string; credit: string };
export const CLOSE_MONTH = "October 2026";
export const periodReviews: Record<string, { documents: number; bankLines: number; decisions: number; adjustments: Adjustment[] }> = {
  "Marina Events FZ-LLC": {
    documents: 64,
    bankLines: 131,
    decisions: 97,
    adjustments: [
      { description: "Accrual: October venue electricity", amount: 2350, debit: "6410 Utilities", credit: "2150 Accrued expenses" },
      { description: "Prepayment: event insurance (month 3 of 12)", amount: 1075, debit: "6520 Insurance", credit: "1420 Prepayments" },
      { description: "Depreciation: LED video wall (month 7 of 36)", amount: 3150, debit: "6710 Depreciation", credit: "1590 Accumulated depreciation" },
    ],
  },
  "Al Sufouh Interiors LLC": {
    documents: 41,
    bankLines: 88,
    decisions: 63,
    adjustments: [{ description: "Depreciation: showroom fit-out (month 4 of 60)", amount: 1840, debit: "6710 Depreciation", credit: "1590 Accumulated depreciation" }],
  },
  "Palm Crest Dental Clinic": { documents: 37, bankLines: 102, decisions: 55, adjustments: [] },
  "Blue Dhow Logistics LLC": {
    documents: 72,
    bankLines: 167,
    decisions: 118,
    adjustments: [
      { description: "Accrual: October fuel cards", amount: 4615, debit: "5410 Fuel", credit: "2150 Accrued expenses" },
      { description: "Depreciation: delivery van (month 11 of 60)", amount: 2250, debit: "6710 Depreciation", credit: "1590 Accumulated depreciation" },
    ],
  },
};
export const closeChecklistDone = (r: (typeof periodReviews)[string]) => [
  { label: "All documents processed", detail: `${r.documents} documents processed` },
  { label: "Bank statement reconciled", detail: `All ${r.bankLines} bank lines matched or explained` },
  { label: "All decisions reviewed", detail: `All ${r.decisions} decisions reviewed` },
  { label: "No missing evidence", detail: null },
  { label: "VAT workings prepared", detail: null },
];

/** Period close: periods ready for sign-off (the Overview's four) and those still in progress. */
export const periodsReady = readyForSignoff.map((p) => ({ ...p, adjustments: periodReviews[p.client]?.adjustments.length ?? 0 }));
export const periodsInProgress: { client: string; month: string; detail: string; blocked: number }[] = [
  { client: "Oasis Grid Engineering LLC", month: "Oct 2026", detail: oasisStatement, blocked: 1 },
  { client: client.name, month: "Nov 2026", detail: "month still running", blocked: 0 },
];

/** Knowledge: the firm's policies, rules, supplier mappings and precedents. */
export const KNOWLEDGE_TABS = ["Policies", "Rules", "Supplier mappings", "Precedents"] as const;
export type KnowledgeTab = (typeof KNOWLEDGE_TABS)[number];

export const policies = [
  { title: "Materiality", body: "Anything above AED 5,000.00 goes to a reviewer, whatever oneth's confidence. Partners sign off every period.", changed: "02 Nov 2026" },
  { title: "Office consumables", body: "Paper, toner, stationery and small desk items go to 6120 Office supplies, never to fixed assets.", changed: "21 Oct 2026" },
  { title: "Capitalisation", body: "Equipment over AED 5,000.00 that lasts more than a year is capitalised and depreciated straight-line over 36 months.", changed: "30 Sep 2026" },
  { title: "Client requests", body: "oneth drafts requests for missing receipts and answers. A person reads and sends every one.", changed: "15 Sep 2026" },
];

export const rules = [
  { title: "Input VAT on a valid tax invoice", description: "Recover 5% input VAT only when the invoice shows the supplier's TRN and the VAT amount.", version: 3, active: true },
  { title: "Reverse charge on imported services", description: "Services bought from outside the UAE are reverse charged at 5%.", version: 2, active: true },
  { title: "Blocked input VAT on entertainment", description: "VAT on entertaining clients and guests is not recoverable.", version: 1, active: true },
  { title: "Zero-rated exports", description: "Goods exported outside the GCC with proof of export are zero-rated.", version: 2, active: true },
  { title: "Round VAT per line", description: "Round VAT on each invoice line instead of on the total.", version: 1, active: false },
];

export const supplierMappings = [
  { supplier: invoice.supplier, code: "6120", account: "Office supplies", trn: invoice.supplierTrn, vat: "SR" },
  { supplier: receipt.merchant, code: "5110", account: "Kitchen supplies", trn: "100661234090003", vat: "SR" },
  { supplier: "Marina Heights Facilities", code: "6310", account: "Facilities", trn: "100447122900003", vat: "SR" },
  { supplier: "Al Manara Catering", code: "5120", account: "Catering", trn: "100338109270003", vat: "SR" },
  { supplier: "Harbour Tools Trading LLC", code: "5310", account: "Tools and consumables", trn: "100559014730003", vat: "SR" },
];

/** Performance, per range. The 30-day autonomous share is the Overview's "Auto-decided". */
export const PERFORMANCE_RANGES = ["7 days", "30 days", "90 days"] as const;
export type PerformanceRange = (typeof PERFORMANCE_RANGES)[number];

const overturnSum = (rows: QueueRow[]) => round2(rows.reduce((s, r) => s + r.amount, 0));
const series = (points: [string, number][]) => points.map(([date, rate]) => ({ date, rate }));

export const performance: Record<
  PerformanceRange,
  {
    from: string;
    to: string;
    accuracy: { label: string; value: number }[];
    autonomous: number;
    overturnRate: { date: string; rate: number }[];
    overturned: QueueRow[];
    overturnedValue: number;
    hoursSaved: string;
  }
> = {
  "7 days": {
    from: "11 Nov 2026",
    to: "17 Nov 2026",
    accuracy: [
      { label: "Classification", value: 0.95 },
      { label: "Reconciliation", value: 0.99 },
      { label: "VAT treatment", value: 0.97 },
    ],
    autonomous: 0.41,
    overturnRate: series([["11 Nov", 0.05], ["12 Nov", 0.04], ["13 Nov", 0.06], ["14 Nov", 0.03], ["15 Nov", 0.04], ["16 Nov", 0.05], ["17 Nov", 0.04]]),
    overturned: overturns.slice(0, 1),
    overturnedValue: overturnSum(overturns.slice(0, 1)),
    hoursSaved: "9.6",
  },
  "30 days": {
    from: "19 Oct 2026",
    to: "17 Nov 2026",
    accuracy: [
      { label: "Classification", value: 0.94 },
      { label: "Reconciliation", value: 0.98 },
      { label: "VAT treatment", value: 0.96 },
    ],
    autonomous: overviewToday.autoDecided,
    overturnRate: series([["19 Oct", 0.09], ["22 Oct", 0.08], ["25 Oct", 0.08], ["28 Oct", 0.07], ["31 Oct", 0.07], ["3 Nov", 0.06], ["6 Nov", 0.05], ["9 Nov", 0.06], ["12 Nov", 0.05], ["15 Nov", 0.04], ["17 Nov", 0.04]]),
    overturned: overturns,
    overturnedValue: overturnSum(overturns),
    hoursSaved: "31.4",
  },
  "90 days": {
    from: "20 Aug 2026",
    to: "17 Nov 2026",
    accuracy: [
      { label: "Classification", value: 0.92 },
      { label: "Reconciliation", value: 0.97 },
      { label: "VAT treatment", value: 0.95 },
    ],
    autonomous: 0.33,
    overturnRate: series([["20 Aug", 0.15], ["27 Aug", 0.14], ["3 Sep", 0.13], ["10 Sep", 0.12], ["17 Sep", 0.11], ["24 Sep", 0.1], ["1 Oct", 0.1], ["8 Oct", 0.09], ["15 Oct", 0.08], ["22 Oct", 0.08], ["29 Oct", 0.07], ["5 Nov", 0.06], ["12 Nov", 0.05]]),
    overturned: overturns,
    overturnedValue: 38415.5,
    hoursSaved: "84.2",
  },
};

/** Settings: tabs, the permission matrix (frontend/src/lib/control.ts), team, integrations, branding. */
export const SETTINGS_TABS = ["Permissions", "Team", "Branding", "Integrations", "Appearance"] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];

export type PermissionMode = "off" | "propose" | "auto_under_threshold" | "auto";
export const PERMISSION_MODE_LABEL: Record<PermissionMode, string> = {
  off: "Off",
  propose: "Propose",
  auto_under_threshold: "Auto under a threshold",
  auto: "Auto",
};

export const permissionSettings: { label: string; detail: string; mode: PermissionMode; threshold?: string; locked?: boolean }[] = [
  { label: "Classify routine expenses", detail: "Choose the account for a supplier invoice or receipt.", mode: "auto_under_threshold", threshold: "2,000.00" },
  { label: "Apply standard VAT", detail: "Use 5% VAT where the document supports it.", mode: "auto_under_threshold", threshold: "2,000.00" },
  { label: "Match bank lines", detail: "Match a bank line to the invoice, bill or booking it pays.", mode: "auto" },
  { label: "Send routine requests", detail: "oneth proposes asking a client for a receipt or an answer; a person sends it (off or propose only).", mode: "propose" },
  { label: "Post entries", detail: "oneth never writes to an accounting system: off or propose only.", mode: "propose" },
  { label: "Submit tax returns", detail: "Tax filing is never automated.", mode: "off", locked: true },
];

export const team = [
  { name: firm.partner, email: "aisha@rahmanco.example", role: "Partner" },
  { name: firm.reviewer, email: "sara@rahmanco.example", role: "Reviewer" },
  { name: "Fatima Noor", email: "fatima@rahmanco.example", role: "Reviewer" },
  { name: "Daniel Joseph", email: "daniel@rahmanco.example", role: "Staff" },
];

export const branding = { logo: "https://rahmanco.example/logo.svg", colour: "#0E6B57" };

export const integrations = portfolio.filter((c) => c.system !== "None").map((c) => ({ client: c.name, system: c.system, connection: c.connection }));

/* ------------------------------------------------------------------ */
/* The hero's hands-on story: Saffron Grove's to-do list               */
/* ------------------------------------------------------------------ */

/** The two open Al Manara bills that both match the 11 Nov payment of AED 6,250.00. */
export type ManaraBill = "AMC-3391" | "AMC-3402";
export const alManaraBills: { ref: ManaraBill; description: string; issued: string; due: string; suggested?: number }[] = [
  { ref: "AMC-3391", description: "Staff meals, 1 to 15 Oct", issued: "12 Oct 2026", due: "11 Nov 2026", suggested: 0.52 },
  { ref: "AMC-3402", description: "Staff meals, 16 to 31 Oct", issued: "26 Oct 2026", due: "25 Nov 2026" },
];
export const alManaraLine = { date: "11 Nov 2026", description: "TRF AL MANARA CATERING", amount: catering };

/** The card payment with no receipt, and the entry oneth proposes once the client's photo arrives. */
export const bazaarLine = { date: "12 Nov 2026", description: "CARD 4021 BAZAAR LANE ONLINE", amount: bazaarInvoice.gross, account: client.account };
export const bazaarEntry = [
  { code: "6330", account: "Furniture and small equipment", debit: bazaarInvoice.net, credit: 0 },
  { code: "1450", account: "Input VAT recoverable", debit: bazaarInvoice.vat, credit: 0 },
  { code: "1010", account: `Bank, account ending ${client.account}`, debit: 0, credit: bazaarInvoice.gross },
];

/** Saffron Grove's November before the story: what the engine's close checklist counts. */
export const novemberFacts = { month: "November 2026", documents: 46, bankLines: 58, decisions: 51 };

// Load-time checks: the counts on every screen agree before anyone clicks
{
  const escalatedRows = needsYou.filter((d) => d.state === "escalated").length;
  const open = portfolio.reduce((s, c) => s + c.openItems, 0);
  if (open !== overviewToday.awaitingReview + escalatedRows) throw new Error("Clients' open items must equal awaiting review + escalated");
  const story = needsYou.filter((d) => d.id);
  if (story.length !== 3 || portfolio[0].openItems !== story.length) throw new Error("Saffron Grove's open items must be the three story decisions");
  for (const c of portfolio) {
    const rows = [...decisionQueue["Awaiting review"], ...decisionQueue.Escalated].filter((r) => r.client === c.name).length;
    if (rows > c.openItems) throw new Error(`${c.name}: more queue rows than open items`);
  }
}
