/**
 * Geometry for the guide's spotlight: where an element sits inside the app frame (in the frame's own pixels, since
 * the hero may scale it), and where the callout card goes beside it.
 */

export type Rect = { x: number; y: number; w: number; h: number };

/** The first matching element that is actually laid out (some layouts render a piece twice and hide one). */
export function findVisible(frame: HTMLElement, selector: string): HTMLElement | null {
  for (const el of frame.querySelectorAll<HTMLElement>(selector)) if (el.getClientRects().length) return el;
  return null;
}

/** `el`'s box inside `frame`, padded, and kept inside the frame (the frame clips anything outside). */
export function measure(frame: HTMLElement, el: Element, pad: number): Rect {
  const f = frame.getBoundingClientRect();
  const b = el.getBoundingClientRect();
  const k = f.width / frame.offsetWidth || 1;
  const x = Math.max(4, (b.left - f.left) / k - pad);
  const y = Math.max(4, (b.top - f.top) / k - pad);
  const right = Math.min(frame.offsetWidth - 4, (b.right - f.left) / k + pad);
  const bottom = Math.min(frame.offsetHeight - 4, (b.bottom - f.top) / k + pad);
  return { x, y, w: Math.max(0, right - x), h: Math.max(0, bottom - y) };
}

const GAP = 16; // between the card and what it points at
const EDGE = 8; // between the card and the frame's edge
const RAIL = 80; // keep clear of the rail
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export type Side = "auto" | "below" | "right" | "left";

/** Beside the lit element if there's room (right, then left), else below, above, or over its bottom-right corner. */
export function placeCallout(h: Rect, fw: number, fh: number, cw: number, ch: number, side: Side = "auto") {
  const y = (v: number) => clamp(v, EDGE, fh - ch - EDGE);
  const x = (v: number) => clamp(v, RAIL, fw - cw - GAP);
  const roomRight = fw - (h.x + h.w) >= cw + GAP + EDGE;
  const roomLeft = h.x - RAIL >= cw + GAP;
  const roomBelow = fh - (h.y + h.h) >= ch + GAP + EDGE;
  const roomAbove = h.y >= ch + GAP + EDGE;
  const right = { left: h.x + h.w + GAP, top: y(h.y) };
  const left = { left: h.x - GAP - cw, top: y(h.y) };
  const below = { left: x(h.x), top: h.y + h.h + GAP };
  if (side === "below" && roomBelow) return below;
  if (side === "right") return { left: Math.min(h.x + h.w + GAP, fw - cw - EDGE), top: y(h.y) };
  if (side === "left" && roomLeft) return left;
  if (roomRight) return right;
  if (roomLeft) return left;
  if (roomBelow) return { left: x(h.x + h.w - cw), top: h.y + h.h + GAP };
  if (roomAbove) return { left: x(h.x + h.w - cw), top: h.y - GAP - ch };
  return { left: x(h.x + h.w - cw - GAP), top: y(h.y + h.h - ch - GAP) };
}
