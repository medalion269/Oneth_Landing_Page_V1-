/*
 * The calculator's one-page PDF report, made in the visitor's browser with pdf-lib (loaded only when they ask for it).
 * Every figure comes from lib/capacity.ts, the same arithmetic as the screen. Standard Helvetica only: no font files.
 */
import type { PDFFont, PDFPage, RGB } from "pdf-lib";
import { HOURS_PER_WEEK, ONETH_ESTIMATE, capacity, group, headline, hours, workings, type Firm } from "./capacity";

/** The logo's paths (components/Brand.tsx, viewBox 525 195 950 290). The "o" is drawn as two ellipses on white. */
const LOGO_N = "M783 465V262h60v31c19-25 47-38 79-38c46 0 76 30 76 81v129h-60V347c0-27-16-41-40-41c-32 0-55 21-55 51v108Z";
const LOGO_E = "M1214 362A85 84 0 1 0 1198 410";
const LOGO_T = "M1271 207v83q0 13 15 13h15";
const LOGO_H = "M1323 205v110M1323 268c0-20 13-30 32-30c21 0 32 12 32 32v45";
const LOGO_SQUARE = "M1427 271H1458A7 7 0 0 1 1465 278V308A7 7 0 0 1 1458 315H1427A7 7 0 0 1 1420 308V278A7 7 0 0 1 1427 271Z";

const A4 = { w: 595.28, h: 841.89 };
const M = 48; // margin

export async function capacityReportPdf(firm: Firm, who: { email: string; firmName: string }): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
  // The landing's tokens (app/globals.css)
  const C = {
    ink: hex("#18181b"),
    muted: hex("#71717a"),
    faint: hex("#a1a1aa"),
    accent: hex("#033ffe"),
    accentInk: hex("#0232d4"),
    accentSoft: hex("#e6ecff"),
    line: hex("#e8e7e4"),
    canvas: hex("#f8f7f4"),
    white: rgb(1, 1, 1),
  };

  const doc = await PDFDocument.create();
  doc.setTitle("oneth capacity report");
  doc.setAuthor("oneth");
  doc.setSubject("How many more clients can your team take?");
  const page = doc.addPage([A4.w, A4.h]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const c = capacity(firm);
  const w = workings(firm);
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const aed = (n: number) => `AED ${group(n)}`;
  const width = A4.w - 2 * M;

  /** Write wrapped text from the top line's top edge; returns the y below the last line. */
  const text = (s: string, x: number, top: number, o: { font?: PDFFont; size?: number; color?: RGB; maxWidth?: number; leading?: number; align?: "left" | "right" } = {}) => {
    const font = o.font ?? regular;
    const size = o.size ?? 10;
    const leading = o.leading ?? size * 1.4;
    const lines = wrap(s, font, size, o.maxWidth ?? width);
    lines.forEach((line, i) => {
      const lx = o.align === "right" ? x - font.widthOfTextAtSize(line, size) : x;
      page.drawText(line, { x: lx, y: top - size * 0.8 - i * leading, size, font, color: o.color ?? C.ink });
    });
    return top - (lines.length - 1) * leading - size * 1.25;
  };
  const box = (x: number, top: number, w: number, h: number, o: { fill?: RGB; border?: RGB }) =>
    page.drawRectangle({ x, y: top - h, width: w, height: h, color: o.fill, borderColor: o.border, borderWidth: o.border ? 0.75 : 0 });

  // Header: the logo, and what this is
  drawLogo(page, M, A4.h - M, 20, C.ink, C.accent, C.white);
  text("Capacity report", A4.w - M, A4.h - M + 1, { font: bold, size: 9.5, color: C.ink, align: "right" });
  text(date, A4.w - M, A4.h - M - 12, { size: 9, color: C.muted, align: "right" });

  let y = A4.h - M - 52;
  y = text("How many more clients can your team take?", M, y, { font: bold, size: 21, leading: 25 });
  // Standard Helvetica only has Western characters (pdf-lib throws on others, e.g. an Arabic firm name): use the first
  // name it can draw
  const drawable = (s: string) => {
    try {
      regular.encodeText(s);
      return true;
    } catch {
      return false;
    }
  };
  const forWhom = [who.firmName, who.email].find((s) => s && drawable(s));
  if (forWhom) y = text(`Prepared for ${forWhom}`, M, y - 4, { size: 10, color: C.muted });

  // The answer
  y -= 18;
  const answer = headline(firm);
  const answerLines = wrap(answer, bold, 14, width - 36);
  const answerH = answerLines.length * 19 + 32;
  box(M, y, width, answerH, { fill: C.accentSoft });
  text(answer, M + 18, y - 17, { font: bold, size: 14, leading: 19, color: C.accentInk, maxWidth: width - 36 });
  y -= answerH + 12;

  const tiles = [
    { label: "Clients your team could handle", value: group(c.clientsAfter), sub: `${group(c.clients)} today` },
    { label: "Fees a month at that size", value: aed(c.revenueAfter), sub: `${aed(c.revenue)} today` },
    { label: "More revenue a year", value: aed(c.moreRevenue * 12), sub: `${aed(c.moreRevenue)} a month, same team` },
  ];
  const gap = 10;
  const tw = (width - 2 * gap) / 3;
  tiles.forEach((t, i) => {
    const x = M + i * (tw + gap);
    box(x, y, tw, 68, { border: C.line });
    text(t.label, x + 12, y - 12, { size: 8.5, color: C.muted, maxWidth: tw - 24 });
    // One line always: a long amount gets a smaller size rather than wrapping onto the line below
    const valueSize = Math.min(18, (18 * (tw - 24)) / bold.widthOfTextAtSize(t.value, 18));
    text(t.value, x + 12, y - 28 - (18 - valueSize) / 2, { font: bold, size: valueSize, color: C.accentInk, maxWidth: Infinity });
    text(t.sub, x + 12, y - 50, { size: 8, color: C.muted, maxWidth: tw - 24 });
  });
  y -= 68 + 24;

  // How it adds up: team hours, hours per client, the same with oneth, clients
  y = text("How it adds up", M, y, { font: bold, size: 12 });
  y -= 2;
  w.forEach((r) => {
    page.drawLine({ start: { x: M, y }, end: { x: M + width, y }, thickness: 0.5, color: C.line });
    const color = r.oneth ? C.accentInk : C.ink;
    text(r.label, M, y - 7, { font: bold, size: 10, color });
    text(r.sum, M + 140, y - 7, { size: 10, color: C.muted, maxWidth: width - 260 });
    text(r.result, M + width, y - 7, { font: bold, size: 10, color, align: "right" });
    y -= 26;
  });
  page.drawLine({ start: { x: M, y }, end: { x: M + width, y }, thickness: 0.5, color: C.line });
  y -= 22;

  // Their answers
  y = text("Your answers", M, y, { font: bold, size: 12 });
  y -= 2;
  const rows: [string, string][] = [
    ["Accountants", group(firm.accountants)],
    ["Clients", group(firm.clients)],
    ["Average fee a month", aed(firm.fee)],
  ];
  rows.forEach(([label, value]) => {
    page.drawLine({ start: { x: M, y }, end: { x: M + width, y }, thickness: 0.5, color: C.line });
    text(label, M, y - 6, { size: 9.5, color: C.muted });
    y = text(value, M + 180, y - 6, { size: 9.5, maxWidth: width - 180 }) - 3;
  });
  page.drawLine({ start: { x: M, y }, end: { x: M + width, y }, thickness: 0.5, color: C.line });
  y -= 22;

  // How it is worked out
  y = text("How this is worked out", M, y, { font: bold, size: 12 });
  y = text(
    `From your three answers and two figures of ours. Each accountant works ${HOURS_PER_WEEK} hours a week, a typical UAE office week; ` +
      `times 52 weeks, divided by 12 months, that is ${hours(HOURS_PER_WEEK * 260)} hours a month each. Your team is busy with the clients it has, ` +
      `so each client takes your team's hours divided by your clients. With oneth, each client takes about ${ONETH_ESTIMATE}% less time, so the same hours handle more clients; ` +
      `only whole clients count, each paying your average fee. More revenue is the extra clients' fees with the same team, before software costs. ` +
      `${ONETH_ESTIMATE}% is our estimate of the time oneth takes off a client's month: invoices, bills and bank lines arrive read and matched, and your team checks them. It has not been measured yet.`,
    M,
    y - 2,
    { size: 8.5, color: C.muted, leading: 12.5 },
  );

  // Next step: right after the text above, so the two can never overlap
  const ctaH = 58;
  const ctaTop = y - 14;
  box(M, ctaTop, width, ctaH, { fill: C.ink });
  text("Want the real figure?", M + 18, ctaTop - 15, { font: bold, size: 12, color: C.white });
  text("A free pilot measures it on one of your clients over one month. No cost, no commitment. Apply at oneth.ai", M + 18, ctaTop - 34, {
    size: 9.5,
    color: C.white,
    maxWidth: width - 36,
    leading: 13.5,
  });

  // Footer
  page.drawLine({ start: { x: M, y: M + 18 }, end: { x: M + width, y: M + 18 }, thickness: 0.5, color: C.line });
  text("oneth prepares bookkeeping work for accounting firms in the UAE. Your team reviews and approves.", M, M + 10, { size: 8, color: C.faint });
  text("oneth.ai", A4.w - M, M + 10, { font: bold, size: 8, color: C.muted, align: "right" });

  return doc.save();
}

/** The wordmark at (x, top), `h` points tall. */
function drawLogo(page: PDFPage, x: number, top: number, h: number, ink: RGB, accent: RGB, paper: RGB) {
  const s = h / 290;
  const at = (sx: number, sy: number) => ({ x: x + (sx - 525) * s, y: top - (sy - 195) * s });
  const path = { x: x - 525 * s, y: top + 195 * s, scale: s };
  // "o": the outer ellipse in ink, the counter in the page colour
  page.drawEllipse({ ...at(647.5, 357.5), xScale: 112.5 * s, yScale: 109.5 * s, color: ink });
  page.drawEllipse({ ...at(649, 357.5), xScale: 53 * s, yScale: 57 * s, color: paper });
  page.drawSvgPath(LOGO_N, { ...path, color: ink });
  // pdf-lib scales the line width with the path, so widths are in the logo's own units
  page.drawSvgPath(LOGO_E, { ...path, borderColor: ink, borderWidth: 58 });
  page.drawRectangle({ ...at(1050, 392), width: 193 * s, height: 42 * s, color: ink });
  page.drawSvgPath(LOGO_T, { ...path, borderColor: ink, borderWidth: 24 });
  page.drawRectangle({ ...at(1243, 255), width: 57 * s, height: 22 * s, color: ink });
  page.drawSvgPath(LOGO_H, { ...path, borderColor: ink, borderWidth: 24 });
  page.drawSvgPath(LOGO_SQUARE, { ...path, color: accent });
}

/** Greedy word wrap with the font's own widths */
function wrap(s: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  // Ordinary spaces only: a no-break space keeps an amount together
  for (const word of s.split(/[ \n]+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.widthOfTextAtSize(next, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
