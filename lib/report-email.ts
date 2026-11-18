/*
 * The email the firm receives when someone downloads the calculator's report (app/api/apply/route.ts). Plain text;
 * the results are worked out again here from the answers, so figures from the browser are never trusted.
 */
import { CLIENT_SIZES, group, hours, today, transactions, withFreedTime } from "./capacity";
import type { ReportSubmission } from "./validation";

export function reportEmail(data: ReportSubmission, when: string) {
  const firm = { people: data.people, clients: data.clients, fee: data.fee, size: data.size };
  const now = today(firm);
  const after = withFreedTime(firm, data.estimate);
  const aed = (n: number) => `AED ${group(n)}`;
  const lines = [
    "Someone downloaded the capacity report from oneth.ai",
    "",
    `Email:     ${data.email}`,
    `Firm:      ${data.firmName || "(not given)"}`,
    `Submitted: ${when} (UAE time)`,
    "",
    "Their answers",
    `  People on client work:  ${data.people}`,
    `  Clients:                ${data.clients}`,
    `  Average fee a month:    ${aed(data.fee)}`,
    `  A typical client:       ${CLIENT_SIZES[data.size].label} (about ${group(transactions(data.size))} invoices, bills and bank lines a month)`,
    `  Their estimate:         ${data.estimate}% of routine time saved`,
    "",
    "Their results",
    `  Team today:             ${now.fullPercent}% of client hours taken, room for ${now.room} more clients`,
    `  Hours freed a month:    ${group(hours(after.freed))}`,
    `  More clients:           ${after.extraClients}`,
    `  Extra profit a month:   ${aed(after.extraFees)} (${aed(after.extraFees * 12)} a year)`,
    "",
    "Reply to this email to answer them directly.",
  ];
  return {
    subject: `Calculator report: ${data.email}${data.firmName ? ` (${data.firmName})` : ""}`,
    text: lines.join(String.fromCharCode(10)),
  };
}
