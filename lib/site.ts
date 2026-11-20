/**
 * The page's public address and the words search engines show (docs/DECISIONS.md, L29).
 *
 * oneth.ai redirects (308) to www.oneth.ai, so www is the canonical host: the canonical tag, Open Graph URLs,
 * robots.txt, the sitemap and the structured data all use it. The project's *.vercel.app address serves the same
 * page; the canonical tag points search engines back here.
 */
export const SITE_URL = "https://www.oneth.ai";

/** The search result's title: the category and "UAE" first, the name last. */
export const SEARCH_TITLE = "AI bookkeeping for UAE accounting firms · oneth";

/** The page's own line, kept for link previews (WhatsApp, LinkedIn, X), where the picture already says what oneth is. */
export const SHARE_TITLE = "oneth · Grow your client base. Not your payroll.";

/** About 155 characters, so search results show all of it. */
export const DESCRIPTION =
  "oneth prepares the bookkeeping for accounting firms in the UAE: invoices, bank reconciliation and VAT. Your team approves every entry. Apply for a free pilot.";

/** The six features, as the Features section names them. Keep in step with `features` in components/Features.tsx (a
 *  client module, so the server can't import its array). */
export const FEATURES = [
  "Invoice and receipt processing",
  "Transaction categorisation",
  "Bank reconciliation",
  "UAE VAT preparation",
  "Missing document requests",
  "Month-end close",
];
