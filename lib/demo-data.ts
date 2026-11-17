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

/** "Needs you": escalations first, then what waits longest. Amounts reuse the scenes below. */
export const needsYou: { kind: DecisionKind; state: DecisionState; issue: string; client: string; amount: number; confidence: number }[] = [
  { kind: "bank_match", state: "escalated", issue: `Two open bills match AED ${aed(catering)} to Al Manara Catering`, client: client.name, amount: catering, confidence: 0.52 },
  { kind: "missing_evidence", state: "escalated", issue: "No receipt for card payment at Bazaar Lane Online", client: client.name, amount: 1149, confidence: 0.41 },
  { kind: "classification", state: "awaiting_review", issue: `Classify ${invoice.supplierShort} invoice ${invoice.number}`, client: client.name, amount: invoice.total, confidence: 0.94 },
  { kind: "vat_treatment", state: "awaiting_review", issue: `VAT treatment for ${receipt.merchant} receipt ${receipt.number}`, client: client.name, amount: receipt.gross, confidence: 0.88 },
  { kind: "classification", state: "awaiting_review", issue: "Record sales invoice SI-1027", client: "Marina Events FZ-LLC", amount: salesNet + vatOn(salesNet), confidence: 0.91 },
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
const listNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : (names[0] ?? ""));
const escalated = needsYou.filter((d) => d.state === "escalated").length;

/** oneth's daily briefing: short sentences, like an assistant message. Counts and names come from the cards beside it. */
export const briefing = [
  `I finished ${overviewToday.tasksDone} tasks today and am working on ${overviewToday.tasksRunning} more.`,
  `${escalated} decisions escalated and ${overviewToday.awaitingReview} waiting for review. Start with ${client.name}: two open bills match AED ${aed(catering)} to Al Manara Catering.`,
  `${readyForSignoff.length} periods are ready for sign-off: ${listNames(readyForSignoff.map((p) => p.client))}.`,
  `October VAT returns for ${vatDeadlines.length} clients are due in ${vatDeadlines[0].daysLeft} days (${vatDeadlines[0].due}).`,
];

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
/* Settings → Permissions (autonomy earned over the months)             */
/* ------------------------------------------------------------------ */

export type LimitStage = 1 | 2 | 3;
export type PermissionMode = "off" | "propose" | "auto_under_threshold" | "auto";

export const PERMISSION_MODE_LABEL: Record<PermissionMode, string> = {
  off: "Off",
  propose: "Propose",
  auto_under_threshold: "Auto under a threshold",
  auto: "Auto",
};

export const limitStages: { id: LimitStage; label: string; caption: string }[] = [
  { id: 1, label: "Pilot month", caption: "oneth proposes everything and your team approves it, alongside its own work." },
  { id: 2, label: "Month 2", caption: "Partners let it match bank lines and classify routine costs up to AED 2,000." },
  { id: 3, label: "Month 3", caption: "Standard VAT under AED 1,000 too. Requests, posting and tax returns stay with people." },
];

/**
 * The app's permission matrix (frontend/src/lib/control.ts labels) for a fictional firm, in its Month 3 state.
 * `from` is the stage at which a partner changed the row from Propose; rows without it never change.
 * Requests and posting are propose-only and tax returns are locked off, as in the app.
 */
export const permissions: {
  action: string;
  label: string;
  detail: string;
  mode: PermissionMode;
  threshold?: string;
  from?: LimitStage;
  locked?: boolean;
}[] = [
  { action: "classify_routine_expenses", label: "Classify routine expenses", detail: "Choose the account for a supplier invoice or receipt.", mode: "auto_under_threshold", threshold: "2,000.00", from: 2 },
  { action: "auto_match_bank", label: "Match bank lines", detail: "Match a bank line to the invoice, bill or booking it pays.", mode: "auto", from: 2 },
  { action: "apply_standard_vat", label: "Apply standard VAT", detail: "Use 5% VAT where the document supports it.", mode: "auto_under_threshold", threshold: "1,000.00", from: 3 },
  { action: "send_routine_requests", label: "Send routine requests", detail: "oneth proposes asking a client for a receipt or an answer; a person sends it.", mode: "propose" },
  { action: "post_entries", label: "Post entries", detail: "oneth never writes to an accounting system: off or propose only.", mode: "propose" },
  { action: "submit_tax_return", label: "Submit tax returns", detail: "Tax filing is never automated.", mode: "off", locked: true },
];

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
  date: "19 Nov 2026",
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
/* Period close: Saffron Grove's October, from in progress to signed off */
/* ------------------------------------------------------------------ */

export type ChecklistStatus = "ok" | "warning" | "blocked";
/** The app's chip for each checklist status (frontend/src/lib/periods.ts). */
export const CHECKLIST_LABEL: Record<ChecklistStatus, string> = { ok: "Done", warning: "Check", blocked: "Blocked" };

const unmatched = [1260, 1050];

/**
 * The close checklist the engine builds (backend/engine/close.py), with its exact wording. `before` is where October
 * stood when the month ended; `after` is the finished checklist the partner signs off.
 */
export const closeChecklist: {
  key: string;
  label: string;
  before: { status: ChecklistStatus; detail: string };
  after: { status: ChecklistStatus; detail: string | null };
}[] = [
  {
    key: "documents_processed",
    label: "All documents processed",
    before: { status: "warning", detail: "2 documents still processing" },
    after: { status: "ok", detail: "86 documents processed" },
  },
  {
    key: "bank_reconciled",
    label: "Bank statement reconciled",
    before: { status: "warning", detail: `${unmatched.length} bank lines not matched (AED ${aed(unmatched.reduce((a, b) => a + b, 0))})` },
    after: { status: "ok", detail: "All 214 bank lines matched or explained" },
  },
  {
    key: "decisions_reviewed",
    label: "All decisions reviewed",
    before: { status: "blocked", detail: "3 awaiting review" },
    after: { status: "ok", detail: "All 158 decisions reviewed" },
  },
  {
    key: "missing_evidence",
    label: "No missing evidence",
    before: { status: "blocked", detail: "1 item waiting for evidence from the client" },
    after: { status: "ok", detail: null },
  },
  {
    key: "vat_workings",
    label: "VAT workings prepared",
    before: { status: "warning", detail: "2 decisions affecting VAT still open" },
    after: { status: "ok", detail: null },
  },
];

/** Only blocked items hold up sign-off. */
export const blockedAtStart = closeChecklist.filter((i) => i.before.status === "blocked").length;

export const closePeriod = {
  month: "October 2026",
  signedOffAt: "17 Nov 2026, 16:40",
};

const usefulLife = 36; // months: the capitalisation policy (backend/engine/depreciation.py)
const hoodCost = 18900;
/** oneth's month-end adjustment: straight-line depreciation of an asset capitalised in September (month 2 of 36). */
export const depreciation = {
  description: `Depreciation: Kitchen extraction hood (month 2 of ${usefulLife})`,
  charge: round2(hoodCost / usefulLife), // 525.00
  expense: { code: "6710", name: "Depreciation" },
  accumulated: { code: "1590", name: "Accumulated depreciation" },
};
