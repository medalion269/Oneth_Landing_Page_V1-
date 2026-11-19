"use client";

/**
 * The guide through Saffron Grove's to-do list. The visitor does the work: at each step one thing is lit and pulsing
 * (the next click), everything else is dimmed and can't be clicked, and a short card says what is happening. oneth's
 * part (reading documents, proposing entries, the client answering) happens in response, on its own.
 *
 * It starts only when the visitor chooses (the invite, or the pill beside the page title), and holds the page while
 * it runs (usePageHold). The current step is not stored: it is the first step whose work is not done yet, so the guide
 * follows the visitor and never goes backwards. Escape, Skip, a resize, 30 s of inactivity or the scroll scene going
 * away all stop it; the pill then offers "Continue".
 */

import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowRight, MousePointerClick, RotateCcw } from "lucide-react";
import { ICON_SM } from "../app/ui";
import { INITIAL_WORLD, SG_NOVEMBER, type Nav, type World } from "@/lib/hero-story";
import { findVisible, measure, placeCallout, type Side } from "./spotlight";
import { usePageHold } from "./usePageHold";
import { useHeroSignals } from "./useHeroSignals";
import type { Story } from "./useStory";

type StepKind = "click" | "next" | "watch" | "final";
type Step = {
  key: string;
  /** What to click (and where the pulse goes). */
  target: string;
  /** What to light, when it is more than the click target (a card around its button), or depends on the width. */
  light?: string | (() => string);
  label?: string;
  title?: string;
  text: string;
  kind: StepKind;
  done: (w: World) => boolean;
  /** Where the step happens, so the guide can take a returning visitor back there. */
  home: Pick<Nav, "screen"> & Partial<Pick<Nav, "decision" | "period">>;
  side?: Side;
};

const g = (key: string) => `[data-guide="${key}"]`;
const desert = { screen: "decisions", decision: "desert" } as const;
const bazaar = { screen: "decisions", decision: "bazaar" } as const;
const manara = { screen: "decisions", decision: "manara" } as const;

/** Wording stays inside what the product does: oneth proposes, a person approves, sends and signs off. */
export const GUIDE_STEPS: Step[] = [
  {
    key: "open-desert",
    target: g("row-desert"),
    label: "Task 1 of 3",
    text: "A supplier invoice for Saffron Grove is waiting. Open it.",
    kind: "click",
    done: (w) => w.nav.decision === "desert" || w.desert !== "open",
    home: { screen: "overview" },
  },
  {
    key: "read-desert",
    target: g("desert-review"),
    // Wide screens: the invoice and the record; narrower ones: the invoice, with the card beside it
    light: () => (window.matchMedia("(min-width: 1280px)").matches ? g("desert-review") : g("desert-doc")),
    text: "oneth read the invoice, checked the TRN and 5% VAT, and found 9 earlier bills coded the same way.",
    kind: "next",
    done: (w) => w.acked.includes("read-desert") || w.desert !== "open",
    home: desert,
    side: "right",
  },
  {
    key: "approve-desert",
    target: g("approve"),
    text: "Agree with oneth? Approve it. Nothing is written to your books.",
    kind: "click",
    done: (w) => w.desert !== "open",
    home: desert,
  },
  {
    key: "confirm-inv441",
    target: g("inv441-approve"),
    light: g("inv441-card"),
    title: "The next Desert Line invoice just arrived",
    text: "oneth proposed it by itself, citing the approval you just made. Confirm it.",
    kind: "click",
    done: (w) => w.inv441 === "approved",
    home: desert,
  },
  {
    key: "open-bazaar",
    target: g("next-decision"),
    label: "Task 2 of 3",
    text: "A card payment has no receipt. Open it.",
    kind: "click",
    done: (w) => w.nav.decision === "bazaar" || w.bazaar !== "open",
    home: desert,
  },
  {
    key: "send",
    target: g("send-request"),
    text: "oneth drafted a question for Omar, the client. A person sends every request. Send it.",
    kind: "click",
    done: (w) => w.bazaar !== "open",
    home: bazaar,
  },
  {
    key: "phone",
    target: g("phone"),
    text: "Omar answers from his phone with a photo of the invoice.",
    kind: "watch",
    done: (w) => w.bazaar === "answered" || w.bazaar === "approved",
    home: bazaar,
  },
  {
    key: "approve-bazaar",
    target: g("approve"),
    text: "oneth read the photo: 6 folding chairs, AED 1,149.00 including VAT. Approve the entry.",
    kind: "click",
    done: (w) => w.bazaar === "approved",
    home: bazaar,
  },
  {
    key: "open-manara",
    target: g("next-decision"),
    label: "Task 3 of 3",
    text: "One payment, two bills for the same amount. Open it.",
    kind: "click",
    done: (w) => w.nav.decision === "manara" || w.manara !== null,
    home: bazaar,
  },
  {
    key: "pick-bill",
    target: g("bills"),
    text: "Check the due dates. Which bill does the 11 Nov payment settle?",
    kind: "click",
    done: (w) => w.manara !== null,
    home: manara,
  },
  {
    key: "see-november",
    target: g("see-november"),
    text: "Saffron Grove's to-do list is clear. See their November.",
    kind: "click",
    done: (w) => w.nav.period === SG_NOVEMBER,
    home: manara,
  },
  {
    key: "finish",
    target: g("checklist"),
    title: "Nothing blocking. Sign-off opens when November ends.",
    text: "You made 4 decisions. oneth prepared each one, read Omar's photo and proposed the next invoice.",
    kind: "final",
    done: (w) => w.acked.includes("finish"),
    home: { screen: "close", period: SG_NOVEMBER },
    side: "below",
  },
];

const currentStep = (w: World) => GUIDE_STEPS.find((s) => !s.done(w)) ?? null;
const progressOf = (w: World) => GUIDE_STEPS.filter((s) => s.done(w)).length;

export type GuideStatus = "idle" | "invited" | "running" | "paused" | "finished";

export function useGuide({ story }: { story: Story }) {
  const { world, actions, reduced } = story;
  const [status, setStatus] = useState<GuideStatus>("idle");
  const [holdAt, setHoldAt] = useState<number | null>(null);

  const latest = useRef({ status, reduced, world });
  useEffect(() => {
    latest.current = { status, reduced, world };
  });

  const stop = () => {
    setHoldAt(null);
    setStatus(progressOf(latest.current.world) > 0 ? "paused" : "idle");
  };
  const finish = () => {
    setHoldAt(null);
    setStatus("finished");
  };

  const signals = useHeroSignals({
    // Arrived and live: invite them (once), unless they asked for less motion
    onReady: () => {
      if (latest.current.status === "idle" && !latest.current.reduced) setStatus("invited");
    },
    // The invite stays until Start or No thanks: scrolling away and back, or a resize, leaves it where it was.
    // Only reduced motion (turned on mid-visit) takes it away, as it is never shown with reduced motion.
    onCancel: () => {
      if (latest.current.status === "running") stop();
      else if (latest.current.status === "invited" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) setStatus("idle");
    },
  });

  usePageHold(holdAt, () => stop());

  /** Start (or continue, or start over): go where the next step happens, and hold the page if the app fills it. */
  const begin = (fromScratch: boolean) => {
    if (fromScratch) actions.reset();
    const step = currentStep(fromScratch ? INITIAL_WORLD : world);
    if (!step) return finish();
    actions.navigate(step.home.screen, { decision: step.home.decision ?? null, period: step.home.period ?? null });
    setStatus("running");
    const s = signals.current;
    if (!reduced && s.live) setHoldAt(Math.max(Math.round(window.scrollY), s.flatY));
  };

  const step = status === "running" ? currentStep(world) : null;

  const next = () => {
    if (!step) return;
    actions.ack(step.key);
    if (step.kind === "final") finish();
  };

  // Escape stops it even when the page isn't held (reduced motion)
  useEffect(() => {
    if (status !== "running") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return {
    status,
    step,
    progress: progressOf(world),
    total: GUIDE_STEPS.length,
    reduced,
    start: () => begin(false),
    restart: () => begin(true),
    dismiss: () => setStatus("idle"),
    stop,
    next,
  };
}

export type Guide = ReturnType<typeof useGuide>;

/* ------------------------------------------------------------------ */
/* Drawn over the app                                                  */
/* ------------------------------------------------------------------ */

const DIM = "shadow-[0_0_0_200vmax_rgb(24_24_27/0.45)]";

/**
 * The spotlight, the blockers around it, the pulse and the callout. Geometry is written straight onto the elements
 * (it changes with layout, not with React state), re-measured a few times a second so it follows screens fading in,
 * cards arriving and window resizes.
 */
export function GuideOverlay({ guide, frameRef }: { guide: Guide; frameRef: RefObject<HTMLElement | null> }) {
  const step = guide.step;
  const hole = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const callout = useRef<HTMLDivElement>(null);
  const blocks = useRef<(HTMLDivElement | null)[]>([]);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const key = step?.key;
  const kind = step?.kind;
  const target = step?.target;
  const lightOf = step?.light ?? step?.target;
  const side = step?.side;

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !key || !target || !lightOf) return;
    const lightSel = () => (typeof lightOf === "function" ? lightOf() : lightOf);
    const started = performance.now();
    let focused = false;

    // Clicks reach only the lit element and the guide's own buttons
    const guard = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t) return;
      if (t.closest("[data-guide-ui]")) return;
      const lit = kind === "click" ? findVisible(frame, target) : null;
      if (lit && lit.contains(t)) return;
      e.preventDefault();
      e.stopPropagation();
    };
    frame.addEventListener("click", guard, true);

    const place = () => {
      const fw = frame.offsetWidth;
      const fh = frame.offsetHeight;
      const light = lightSel();
      const el = findVisible(frame, light);
      const clickEl = kind === "click" ? findVisible(frame, target) : null;
      const c = callout.current;
      if (!el) {
        // Not on screen yet (a card about to arrive): after a while, show the card in the middle
        if (hole.current) hole.current.style.opacity = "0";
        if (c && performance.now() - started > 2500) {
          c.style.left = `${(fw - c.offsetWidth) / 2}px`;
          c.style.top = `${(fh - c.offsetHeight) / 2}px`;
          c.style.visibility = "visible";
        }
        return;
      }
      const r = measure(frame, el, kind === "click" && light === target ? 6 : 8);
      const box = (h: HTMLDivElement | null, b: typeof r) => {
        if (!h) return;
        h.style.left = `${b.x}px`;
        h.style.top = `${b.y}px`;
        h.style.width = `${b.w}px`;
        h.style.height = `${b.h}px`;
        h.style.borderRadius = `${Math.min(b.h / 2, 22)}px`;
        h.style.opacity = "1";
      };
      box(hole.current, r);
      // The pulse sits on what to click (the lit area, or a button inside it)
      if (clickEl) box(ring.current, clickEl === el ? r : measure(frame, clickEl, 4));
      // Four blockers around the hole; on steps without a click, one more over it
      const [top, bottom, left, right, over] = blocks.current;
      const set = (b: HTMLDivElement | null | undefined, x: number, y: number, w: number, h: number) => {
        if (!b) return;
        b.style.left = `${x}px`;
        b.style.top = `${y}px`;
        b.style.width = `${Math.max(0, w)}px`;
        b.style.height = `${Math.max(0, h)}px`;
      };
      set(top, 0, 0, fw, r.y);
      set(bottom, 0, r.y + r.h, fw, fh - r.y - r.h);
      set(left, 0, r.y, r.x, r.h);
      set(right, r.x + r.w, r.y, fw - r.x - r.w, r.h);
      set(over, r.x, r.y, kind === "click" ? 0 : r.w, kind === "click" ? 0 : r.h);
      if (c) {
        const p = placeCallout(r, fw, fh, c.offsetWidth, c.offsetHeight, side);
        c.style.left = `${p.left}px`;
        c.style.top = `${p.top}px`;
        c.style.visibility = "visible";
      }
      if (!focused) {
        focused = true;
        const f = clickEl ? (clickEl.matches("button") ? clickEl : clickEl.querySelector("button")) : nextBtn.current;
        f?.focus({ preventScroll: true });
      }
    };
    place();
    const timer = window.setInterval(place, 150);
    return () => {
      window.clearInterval(timer);
      frame.removeEventListener("click", guard, true);
    };
  }, [frameRef, key, kind, target, lightOf, side]);

  if (!step) return null;
  const pct = Math.round((guide.progress / guide.total) * 100);
  return (
    <div data-guide-ui className="pointer-events-none absolute inset-0 z-40">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          ref={(el) => {
            blocks.current[i] = el;
          }}
          aria-hidden
          className="pointer-events-auto absolute"
        />
      ))}
      <div ref={hole} aria-hidden className={`guide-hole pointer-events-none absolute ${DIM} ring-2 ring-white/80`} style={{ opacity: 0 }} />
      {step.kind === "click" && <div ref={ring} aria-hidden className="guide-ring pointer-events-none absolute" style={{ opacity: 0 }} />}
      <div
        key={step.key}
        ref={callout}
        role="dialog"
        aria-label="Guided task"
        className="guide-callout pointer-events-auto absolute flex w-[300px] flex-col gap-1.5 rounded-[20px] bg-paper p-5 text-ink shadow-[0_24px_60px_-12px_rgb(0_0_0/0.35)]"
        style={{ visibility: "hidden", left: 0, top: 0 }}
      >
        <span className="mb-1 block h-1 overflow-hidden rounded-full bg-line-soft">
          <span className="block h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </span>
        {step.label && <span className="text-[12px] font-semibold leading-[16px] text-accent-ink">{step.label}</span>}
        <div aria-live="polite">
          {step.title && <p className="text-[16px] font-semibold leading-[22px]">{step.title}</p>}
          <p className={`text-[14px] leading-[20px] ${step.title ? "mt-1 text-muted" : "text-ink"}`}>{step.text}</p>
        </div>
        {step.kind === "click" && (
          <span className="mt-1 flex items-center gap-1.5 text-[12px] text-muted">
            <MousePointerClick {...ICON_SM} /> Click the highlighted {step.key === "pick-bill" ? "bill" : "item"}
          </span>
        )}
        {step.kind === "watch" && <span className="mt-1 text-[12px] text-muted">Watch: this part happens on its own.</span>}
        <div className="mt-2 flex items-center justify-between gap-3">
          <button type="button" onClick={guide.stop} className="cursor-pointer rounded-full px-1 text-[13px] font-semibold text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-accent">
            {step.kind === "final" ? "Close" : "Skip"}
          </button>
          <span className="flex items-center gap-2">
            {step.kind === "final" && (
              <button
                type="button"
                onClick={guide.restart}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-line-soft px-3.5 text-[13px] font-semibold text-ink outline-none hover:bg-line focus-visible:ring-2 focus-visible:ring-accent"
              >
                <RotateCcw {...ICON_SM} /> Start over
              </button>
            )}
            {(step.kind === "next" || step.kind === "final") && (
              <button
                ref={nextBtn}
                type="button"
                onClick={guide.next}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-semibold text-white outline-none hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                {step.kind === "final" ? "Done" : "Next"}
                {step.kind === "next" && <ArrowRight {...ICON_SM} />}
              </button>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * The invitation, when the app first fills the screen. Not modal: the app stays usable and the page scrolls. It stays
 * until the visitor answers (Start or No thanks), however far they scroll away and back.
 */
export function GuideInvite({ guide }: { guide: Guide }) {
  if (guide.status !== "invited") return null;
  return (
    // Brand-blue gradient so the invitation stands out against the white app it sits on
    <section
      data-guide-ui
      aria-label="Try the app"
      className="guide-invite absolute bottom-5 right-5 z-40 flex w-[340px] flex-col gap-2 rounded-[20px] bg-[radial-gradient(120%_90%_at_100%_0%,rgb(255_255_255/0.16),transparent_55%),linear-gradient(135deg,var(--color-accent),var(--color-accent-ink))] p-5 text-white shadow-[0_2px_6px_rgb(3_63_254/0.2),0_28px_64px_-20px_rgb(3_63_254/0.6)] ring-1 ring-white/10"
    >
      <span className="w-fit rounded-full bg-white/15 px-2.5 py-0.5 text-[12px] font-semibold leading-[18px] text-white">Try it</span>
      <p className="text-[17px] font-semibold leading-[24px]">Clear Saffron Grove&apos;s to-do list</p>
      <p className="text-[14px] leading-[20px] text-white/85">3 tasks, about a minute. oneth prepares, you decide.</p>
      <span className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={guide.start}
          className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-full bg-paper px-5 text-[14px] font-semibold text-accent-ink outline-none hover:bg-accent-soft focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-accent"
        >
          Start <ArrowRight {...ICON_SM} />
        </button>
        <button type="button" onClick={guide.dismiss} className="cursor-pointer rounded-full px-3 py-2 text-[14px] font-semibold text-white/80 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-white">
          No thanks
        </button>
      </span>
    </section>
  );
}

/** Beside the page title: try it, continue it, or start over. Hidden while it runs or while the invite is up. */
export function GuideButton({ guide }: { guide: Guide }) {
  if (guide.status === "running" || guide.status === "invited") return null;
  const label = guide.status === "paused" ? "Continue the tasks" : guide.status === "finished" ? "Start over" : "Try it · 3 tasks";
  return (
    <button
      type="button"
      onClick={guide.status === "finished" ? guide.restart : guide.start}
      className="app-hint inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-full bg-ink py-2 pl-3 pr-4 text-[13px] font-semibold leading-[18px] text-white shadow-app outline-none transition-colors hover:bg-ink/85 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      {guide.status === "finished" ? <RotateCcw {...ICON_SM} /> : <MousePointerClick {...ICON_SM} />}
      {label}
    </button>
  );
}
