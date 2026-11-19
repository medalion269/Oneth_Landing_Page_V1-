/*
 * The email the firm receives when someone downloads the calculator's report (app/api/apply/route.ts). Plain text;
 * the results are worked out again here from the answers, so figures from the browser are never trusted.
 */
import { HOURS_PER_WEEK, ONETH_ESTIMATE, capacity, group, hours } from "./capacity";
import type { ReportSubmission } from "./validation";

export function reportEmail(data: ReportSubmission, when: string) {
  const firm = { accountants: data.accountants, clients: data.clients, fee: data.fee };
  const c = capacity(firm);
  const aed = (n: number) => `AED ${group(n)}`;
  const lines = [
    "Someone downloaded the capacity report from oneth.ai",
    "",
    `Email:     ${data.email}`,
    `Firm:      ${data.firmName || "(not given)"}`,
    `Submitted: ${when} (UAE time)`,
    "",
    "Their answers",
    `  Accountants:                 ${data.accountants}`,
    `  Clients:                     ${data.clients}`,
    `  Average fee a month:         ${aed(data.fee)}`,
    "",
    `Their results (with our figures: ${HOURS_PER_WEEK} h a week each, oneth taking about ${ONETH_ESTIMATE}% off each client's time)`,
    `  Team hours a month:          ${hours(c.team)}`,
    `  Hours a client:              ${hours(c.perClient)} today, ${hours(c.perClientAfter)} with oneth`,
    `  Clients:                     ${group(c.clients)} today, ${group(c.clientsAfter)} with oneth (${group(c.more)} more)`,
    `  Fees a month:                ${aed(c.revenue)} today, ${aed(c.revenueAfter)} with oneth`,
    `  More revenue:                ${aed(c.moreRevenue)} a month (${aed(c.moreRevenue * 12)} a year)`,
    "",
    "Reply to this email to answer them directly.",
  ];
  return {
    subject: `Calculator report: ${data.email}${data.firmName ? ` (${data.firmName})` : ""}`,
    text: lines.join(String.fromCharCode(10)),
  };
}
