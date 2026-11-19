/*
 * The calculator's one-page value report, made in the visitor's browser with pdf-lib (loaded only when they ask for it).
 * It sells the value (docs/DECISIONS.md, L26): one big number, three tiles, where the time comes back task by task, the
 * sums, the basis of the estimate in a few lines, and the pilot. Every figure comes from lib/capacity.ts, the same
 * arithmetic as the screen. Standard Helvetica only, so no font files; it has no arrows, ticks or "≈", so marks are
 * drawn as shapes.
 */
import type { PDFFont, PDFPage, RGB } from "pdf-lib";
import { HOURS_A_MONTH_EACH, HOURS_PER_WEEK, NBSP, ONETH_ESTIMATE, STUDY, TASKS, capacity, group, headline, hours, workings, type Firm } from "./capacity";

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
  doc.setTitle("oneth value report");
  doc.setAuthor("oneth");
  doc.setSubject("What oneth is worth to your firm");
  const page = doc.addPage([A4.w, A4.h]);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const c = capacity(firm);
  const w = workings(firm);
  const gain = c.more > 0;
  const date = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  // A no-break space keeps "AED" and its amount on one line
  const aed = (n: number) => `AED${NBSP}${group(n)}`;
  const width = A4.w - 2 * M;

  type TextOptions = { font?: PDFFont; size?: number; color?: RGB; maxWidth?: number; leading?: number; align?: "left" | "right" };
  /** Height of wrapped text, from the top line's top edge to below the last line (the same as text() moves down) */
  const measure = (s: string, o: TextOptions = {}) => {
    const size = o.size ?? 10;
    const lines = wrap(s, o.font ?? regular, size, o.maxWidth ?? width);
    return (lines.length - 1) * (o.leading ?? size * 1.4) + size * 1.25;
  };
  /** Write wrapped text from the top line's top edge; returns the y below the last line. */
  const text = (s: string, x: number, top: number, o: TextOptions = {}) => {
    const font = o.font ?? regular;
    const size = o.size ?? 10;
    const leading = o.leading ?? size * 1.4;
    const lines = wrap(s, font, size, o.maxWidth ?? width);
    lines.forEach((line, i) => {
      const lx = o.align === "right" ? x - font.widthOfTextAtSize(line, size) : x;
      page.drawText(line, { x: lx, y: top - size * 0.8 - i * leading, size, font, color: o.color ?? C.ink });
    });
    return top - measure(s, o);
  };
  const box = (x: number, top: number, w: number, h: number, o: { fill?: RGB; border?: RGB }) =>
    page.drawRectangle({ x, y: top - h, width: w, height: h, color: o.fill, borderColor: o.border, borderWidth: o.border ? 0.75 : 0 });
  const rule = (y: number, color = C.line, thickness = 0.5) => page.drawLine({ start: { x: M, y }, end: { x: M + width, y }, thickness, color });

  // Header: the logo, and what this is
  drawLogo(page, M, A4.h - M, 20, C.ink, C.accent, C.white);
  text("Value report", A4.w - M, A4.h - M + 1, { font: bold, size: 9.5, color: C.ink, align: "right" });
  text(date, A4.w - M, A4.h - M - 12, { size: 9, color: C.muted, align: "right" });

  let y = A4.h - M - 46;
  y = text("What oneth is worth to your firm", M, y, { font: bold, size: 22, leading: 26 });
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
  if (forWhom) y = text(`Prepared for ${forWhom}`, M, y - 3, { size: 10, color: C.muted });

  // The answer: one big number, and what it means
  y -= 12;
  const team = firm.accountants === 1 ? "Your accountant" : `Your ${group(firm.accountants)} accountants`;
  const hero = gain
    ? {
        label: "More fees a year, with the same team",
        value: aed(c.moreRevenue * 12),
        line: `That's ${aed(c.moreRevenue)} more a month. ${team} could handle ${group(c.clientsAfter)} clients instead of ${group(c.clients)}: ${group(c.more)} more, each paying your average fee of ${aed(firm.fee)}, without hiring.`,
      }
    : { label: "Time back each month", value: `${hours(c.freed)} hours`, line: headline(firm) };
  const pad = 16;
  const inner = width - 2 * pad;
  const heroLabel: TextOptions = { font: bold, size: 10, color: C.accentInk, maxWidth: inner };
  // One line always: a long amount gets a smaller size rather than wrapping
  const heroValueSize = Math.min(32, (32 * inner) / bold.widthOfTextAtSize(hero.value, 32));
  const heroValue: TextOptions = { font: bold, size: heroValueSize, color: C.accentInk, maxWidth: Infinity };
  const heroLine: TextOptions = { size: 11, leading: 15, color: C.ink, maxWidth: inner };
  const heroH = pad + measure(hero.label, heroLabel) + 2 + measure(hero.value, heroValue) + measure(hero.line, heroLine) + pad - 4;
  box(M, y, width, heroH, { fill: C.accentSoft });
  let h = text(hero.label, M + pad, y - pad, heroLabel);
  h = text(hero.value, M + pad, h - 2, heroValue);
  text(hero.line, M + pad, h, heroLine);
  y -= heroH + 8;

  // Three tiles
  const tiles = gain
    ? [
        { label: "Clients your team could handle", value: group(c.clientsAfter), sub: `${group(c.clients)} today, ${group(c.more)} more` },
        { label: "Fees a month at that size", value: aed(c.revenueAfter), sub: `${aed(c.revenue)} today` },
        { label: "Time off each client's month", value: `${ONETH_ESTIMATE}%`, sub: `${hours(c.perClient)} h becomes ${hours(c.perClientAfter)} h` },
      ]
    : [
        { label: "Time off each client's month", value: `${ONETH_ESTIMATE}%`, sub: `${hours(c.perClient)} h becomes ${hours(c.perClientAfter)} h` },
        { label: "Hours back a year", value: `${hours(c.freed * 12)} h`, sub: "for review, advice and growth" },
        { label: "Clients your team could handle", value: group(c.clientsAfter), sub: `${group(c.clients)} today` },
      ];
  const gap = 10;
  const tw = (width - 2 * gap) / 3;
  const tileH = 60;
  tiles.forEach((t, i) => {
    const x = M + i * (tw + gap);
    box(x, y, tw, tileH, { border: C.line });
    text(t.label, x + 12, y - 11, { size: 8.5, color: C.muted, maxWidth: tw - 24 });
    const valueSize = Math.min(18, (18 * (tw - 24)) / bold.widthOfTextAtSize(t.value, 18));
    text(t.value, x + 12, y - 24 - (18 - valueSize) / 2, { font: bold, size: valueSize, color: C.accentInk, maxWidth: Infinity });
    text(t.sub, x + 12, y - 46, { size: 8, color: C.muted, maxWidth: tw - 24 });
  });
  y -= tileH + 10;

  // The same gain, kept as time instead (not on top of the extra clients)
  if (gain) {
    page.drawRectangle({ x: M, y: y - 8, width: 5, height: 5, color: C.accent });
    y = text(
      `Or keep your ${group(c.clients)} ${c.clients === 1 ? "client" : "clients"} and get about ${group(c.freed / 100)} team hours a month back instead.`,
      M + 13,
      y,
      { size: 9.5, color: C.ink, maxWidth: width - 13 },
    );
  }
  y -= 14;

  // Where the time comes back: a client's month, task by task
  y = text("Where the time comes back", M, y, { font: bold, size: 12 });
  y = text("A typical client's month, task by task. Our estimates.", M, y + 1, { size: 8.5, color: C.muted });
  y -= 6;
  const barX = M + 236;
  const k = 4; // points of bar per percent of the month
  // Column heads, with a key for the blue part of each bar
  text("Share of the month", barX, y, { size: 7.5, color: C.muted });
  const keyX = barX + regular.widthOfTextAtSize("Share of the month", 7.5) + 10;
  page.drawRectangle({ x: keyX, y: y - 6.5, width: 6, height: 6, color: C.accent });
  text("oneth's part", keyX + 9, y, { size: 7.5, color: C.muted });
  y = text("oneth takes off", M + width, y, { size: 7.5, color: C.muted, align: "right" });
  y -= 2;
  const rowH = 29;
  TASKS.forEach((t) => {
    rule(y);
    text(t.work, M, y - 6.5, { font: bold, size: 9.5 });
    text(t.oneth, M, y - 17.5, { size: 8.5, color: C.muted, maxWidth: barX - M - 12 });
    const barY = y - rowH / 2 - 3.5;
    page.drawRectangle({ x: barX, y: barY, width: t.share * k, height: 7, color: C.line });
    if (t.cut > 0) page.drawRectangle({ x: barX, y: barY, width: (t.share * t.cut * k) / 100, height: 7, color: C.accent });
    text(`${t.share}%`, barX + t.share * k + 6, y - rowH / 2 + 4, { size: 8.5, color: C.muted, maxWidth: Infinity });
    if (t.cut > 0) text(`${t.cut}% less`, M + width, y - 10, { font: bold, size: 9.5, color: C.accentInk, align: "right" });
    else text("Your team", M + width, y - 10, { size: 9.5, color: C.muted, align: "right" });
    y -= rowH;
  });
  rule(y, C.ink, 0.75);
  text("Each client's month", M, y - 8, { font: bold, size: 10 });
  text(`${hours(c.perClient)} hours becomes ${hours(c.perClientAfter)} hours`, barX, y - 8.5, { size: 9.5, color: C.ink });
  text(`${ONETH_ESTIMATE}% less`, M + width, y - 7, { font: bold, size: 11, color: C.accentInk, align: "right" });
  y -= 20 + 12;

  // How it adds up: the whiteboard's four steps, side by side
  y = text("How it adds up", M, y, { font: bold, size: 12 });
  y -= 2;
  const sw = (width - 3 * 8) / 4;
  const stepH = 48;
  w.forEach((r, i) => {
    const x = M + i * (sw + 8);
    box(x, y, sw, stepH, r.oneth ? { fill: C.accentSoft } : { fill: C.canvas });
    const tone = r.oneth ? C.accentInk : C.ink;
    text(r.label, x + 10, y - 9, { size: 8, color: tone, maxWidth: sw - 20 });
    const size = Math.min(12, (12 * (sw - 20)) / bold.widthOfTextAtSize(r.result, 12));
    text(r.result, x + 10, y - 21, { font: bold, size, color: tone, maxWidth: Infinity });
    text(r.sum, x + 10, y - 36, { size: 7, color: C.muted, maxWidth: sw - 20 });
  });
  y -= stepH + 10;

  // The basis, in a few lines
  y = text(
    `${ONETH_ESTIMATE}% is our estimate: the tasks above, added up. For comparison, a 2025 Stanford and MIT study found ${STUDY.finding} among ${STUDY.who} ` +
      `(${STUDY.source}). Each accountant works ${HOURS_PER_WEEK} hours a week, a typical UAE office week: ${group(HOURS_A_MONTH_EACH)} hours a month. ` +
      `Only whole clients count, at your average fee, before software costs.`,
    M,
    y,
    { size: 8, color: C.muted, leading: 11.5 },
  );

  // Next step: right after the text above, so the two can never overlap
  const ctaBody = "A free one-month pilot on one of your clients shows what oneth takes off your team's month. No cost, no commitment. Apply at oneth.ai";
  const ctaBodyText: TextOptions = { size: 9.5, color: C.white, maxWidth: width - 36, leading: 13 };
  const ctaTop = y - 10;
  const ctaH = 13 + measure("See", { font: bold, size: 12 }) + 3 + measure(ctaBody, ctaBodyText) + 10;
  box(M, ctaTop, width, ctaH, { fill: C.ink });
  const ctaBodyTop = text("See it on your own clients", M + 18, ctaTop - 13, { font: bold, size: 12, color: C.white }) - 3;
  text(ctaBody, M + 18, ctaBodyTop, ctaBodyText);

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
