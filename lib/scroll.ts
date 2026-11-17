import type { MouseEvent } from "react";

/**
 * Smoothly scroll to a section by id (instant when reduced motion is on).
 * Pinned sections are wrapped in a GSAP pin-spacer, so we measure that wrapper
 * to land at the true start of the section.
 */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return false;
  const anchor = el.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = anchor.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  history.replaceState(null, "", `#${id}`);
  return true;
}

export function onAnchorClick(e: MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute("href") || "";
  if (!href.startsWith("#") || e.metaKey || e.ctrlKey || e.shiftKey) return;
  if (scrollToId(href.slice(1))) e.preventDefault();
}
