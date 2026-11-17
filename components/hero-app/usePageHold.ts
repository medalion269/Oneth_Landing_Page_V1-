"use client";

/**
 * Hold the page still at `holdAt` while the guide runs (null: the page is free). It cancels wheel, touch and the
 * scroll keys (Space and Enter still press a focused button), and puts the page back if it moves anyway (a scrollbar
 * drag). Never `overflow: hidden`: that changes the page width and makes ScrollTrigger recalculate the pin.
 *
 * Every way out calls `onExit` once: Escape, a window resize (the pin's length follows the window, so the held spot
 * would be wrong), or 30 seconds without any pointer or key input.
 */

import { useEffect, useRef } from "react";

export type HoldExit = "escape" | "resize" | "idle";
const IDLE_MS = 30_000;
const SCROLL_KEYS = new Set([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"]);

export function usePageHold(holdAt: number | null, onExit: (why: HoldExit) => void) {
  const exit = useRef(onExit);
  useEffect(() => {
    exit.current = onExit;
  });

  useEffect(() => {
    if (holdAt === null) return;
    const y = holdAt;
    let done = false;
    const leave = (why: HoldExit) => {
      if (done) return;
      done = true;
      exit.current(why);
    };
    const put = () => window.scrollTo({ top: y, behavior: "instant" });
    put();

    let lastInput = performance.now();
    const active = () => {
      lastInput = performance.now();
    };
    const stop = (e: Event) => e.preventDefault();
    const onScroll = () => {
      if (Math.abs(window.scrollY - y) > 2) put();
    };
    const onKey = (e: KeyboardEvent) => {
      active();
      if (e.key === "Escape") return leave("escape");
      const onControl = (e.target as HTMLElement | null)?.closest?.("button, a, input, textarea, select");
      if ((e.key === " " || e.key === "Enter") && onControl) return;
      if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    };
    const onResize = () => leave("resize");
    const idle = window.setInterval(() => {
      if (performance.now() - lastInput > IDLE_MS) leave("idle");
    }, 1000);

    window.addEventListener("wheel", stop, { passive: false });
    window.addEventListener("touchmove", stop, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll);
    window.addEventListener("resize", onResize);
    window.addEventListener("pointerdown", active);
    window.addEventListener("pointermove", active);
    window.addEventListener("click", active, true);
    return () => {
      window.clearInterval(idle);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointerdown", active);
      window.removeEventListener("pointermove", active);
      window.removeEventListener("click", active, true);
    };
  }, [holdAt]);
}
