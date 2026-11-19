"use client";

/**
 * All scroll choreography lives here, one function per section.
 *
 * Conventions
 * - Markup is always rendered in its FINAL, readable state. Timelines animate
 *   *from* earlier states, so reduced-motion visitors and anyone without JS
 *   still see the complete story.
 * - Each function builds a gsap.matchMedia(): the full pinned, scrubbed
 *   experience on desktop, light reveals on mobile, nothing under
 *   prefers-reduced-motion. Components call these inside useGSAP, which
 *   reverts everything on unmount.
 * - Only transforms and opacity are animated, plus SVG stroke offsets.
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { useGSAP } from "@gsap/react";
import { aed } from "./demo-data";
import { isNavigating } from "./scroll";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, MotionPathPlugin, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export { gsap, ScrollTrigger, useGSAP };

/**
 * Window events from the hero's scroll scene to its clickable app (components/hero-app):
 * - `live`: the app fills the pinned screen, or stops doing so (detail: { live: boolean, holdY }, holdY being the
 *   scroll position where it lies flat, for holding the page during a replayed tour).
 * - `arrive`: the visitor has just scrolled down onto the flat app for the first time on this load (detail:
 *   { holdY }, the scroll position to hold while the guided tour plays). Never sent on a restored scroll position
 *   or when coming back up from below.
 * - `cancel`: the desktop scene was torn down (resized below 1024px, reduced motion turned on, unmount).
 */
export const HERO_EVENTS = { live: "oneth:hero-live", arrive: "oneth:hero-arrive", cancel: "oneth:hero-cancel" } as const;

export const MEDIA = {
  /** Mirrors the `motion-desktop` Tailwind variant in globals.css */
  desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)",
  motion: "(prefers-reduced-motion: no-preference)",
  /** Large screens with reduced motion: static final frames, connectors still drawn */
  desktopStatic: "(min-width: 1024px) and (prefers-reduced-motion: reduce)",
} as const;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const $ = <T extends Element = HTMLElement>(root: ParentNode, sel: string) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(root: ParentNode, sel: string) => Array.from(root.querySelectorAll<T>(sel));

/**
 * Layout position of `el` inside `ancestor`, ignoring CSS transforms.
 * Used so measurements are the same whatever a timeline is doing.
 */
export function offsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

/** Re-run a layout function whenever ScrollTrigger recalculates (resize, fonts). */
function onRefreshInit(fn: () => void) {
  fn();
  ScrollTrigger.addEventListener("refreshInit", fn);
  return () => ScrollTrigger.removeEventListener("refreshInit", fn);
}

function curve(x1: number, y1: number, x2: number, y2: number, k = 0.5) {
  const dx = (x2 - x1) * k;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} C${(x1 + dx).toFixed(1)} ${y1.toFixed(1)} ${(x2 - dx).toFixed(1)} ${y2.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/** Draw connector lines once (and after fonts load) for the static reduced-motion layout. */
function staticLayout(root: HTMLElement, layout: (stage: HTMLElement) => void) {
  const stage = $(root, "[data-desktop] [data-stage]");
  if (!stage) return;
  layout(stage);
  document.fonts?.ready.then(() => layout(stage));
}

/** Section heading: eyebrow, title and text rise in as the section arrives. */
function revealHeading(root: HTMLElement) {
  const items = $$(root, "[data-heading] > *");
  if (!items.length) return;
  gsap.fromTo(
    items,
    { opacity: 0, y: 28 },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: root, start: "top 80%", toggleActions: "play none none reverse" },
    },
  );
}

/** Simple fade-up for any element marked data-reveal inside `scope`. */
function revealItems(scope: ParentNode, selector = "[data-reveal]") {
  $$(scope, selector).forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 26 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "expo.out",
        delay: Number(el.dataset.revealDelay || 0),
        scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none reverse" },
      },
    );
  });
}

function pinnedTimeline(root: HTMLElement, length: string, extra: ScrollTrigger.Vars = {}) {
  return gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: root,
      start: "top top",
      end: `+=${length}`,
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      ...extra,
    },
  });
}

/* ------------------------------------------------------------------ */
/* Navbar: hide while reading down, return on scroll up                 */
/* ------------------------------------------------------------------ */

export function navbarAnimation(nav: HTMLElement) {
  const mm = gsap.matchMedia();
  // Desktop only: on phones the header scrolls away and the bottom tab bar takes over.
  mm.add(MEDIA.desktop, () => {
    const hide = gsap.to(nav, { yPercent: -120, duration: 0.35, ease: "power2.out", paused: true });
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (self.scroll() < 160 || self.direction === -1) hide.reverse();
        else hide.play();
      },
    });
  });
  return mm;
}

/* ------------------------------------------------------------------ */
/* 1. Hero: the app rises, becomes the screen and can be clicked       */
/* ------------------------------------------------------------------ */

/**
 * `spacer` is the hero's own wrapper element, used as the pin-spacer. Without it ScrollTrigger wraps the section in a
 * new element after hydration and moves it in and out of that wrapper on every refresh; each move restarts the
 * section's CSS entrance animations, so the headline visibly played twice.
 */
export function heroAnimation(root: HTMLElement, spacer?: HTMLElement | null) {
  const mm = gsap.matchMedia();

  mm.add(MEDIA.desktop, () => {
    const copy = $(root, "[data-hero-copy]");
    const dash = $(root, "[data-hero-dash]");
    const frame = dash ? $(dash, "[data-dash-frame]") : null;
    if (!copy || !dash) return;

    // Must equal the CSS starting pose in globals.css (.hero-dash)
    const startY = () => Math.max(window.innerHeight * 0.67, 560);
    // Once the app fills the screen it holds for about a screen of scrolling. The guided work (hero-app/Guide.tsx)
    // plays there, holding the page, then visitors can click around and scroll on.
    const HOLD = 1.1;
    const TOTAL = 1 + HOLD;
    /** Scroll progress at which the app is flat (timeline time 1), and where the page is held during the tour. */
    const FLAT = 1 / TOTAL;
    const HOLD_AT = 1.08 / TOTAL;
    const html = document.documentElement;
    // The app takes clicks and focus only once it is (almost) flat. While it fills the pinned screen, the landing's
    // own top bar steps aside (globals.css), since it would sit on the app's top bar. ScrollTrigger may call this
    // while the timeline is still being created, hence the holder.
    const made: { tl?: gsap.core.Timeline } = {};
    const holdY = () => {
      const st = made.tl?.scrollTrigger;
      return st ? Math.round(st.start + (st.end - st.start) * HOLD_AT) : 0;
    };
    const sync = () => {
      const tl = made.tl;
      if (!tl) return;
      const live = tl.time() >= 0.94;
      const screenFilled = live && !!tl.scrollTrigger?.isActive;
      if (dash.inert === live) dash.inert = !live;
      if (html.hasAttribute("data-hero-app-live") !== screenFilled) {
        html.toggleAttribute("data-hero-app-live", screenFilled);
        window.dispatchEvent(new CustomEvent(HERO_EVENTS.live, { detail: { live: screenFilled, holdY: holdY() } }));
      }
    };

    // Arrival: the scroll position crosses FLAT going down, while still pinned. The first update only records where
    // the page is, so a scroll position restored on reload never counts.
    let lastProgress: number | null = null;
    let arrived = false;
    const watchArrival = (self: ScrollTrigger) => {
      const before = lastProgress;
      lastProgress = self.progress;
      if (arrived || before === null || self.direction !== 1) return;
      if (before < FLAT && self.progress >= FLAT && self.progress < 1) {
        arrived = true;
        // A link carrying the page past the hero is not an arrival: no tour, now or on the way back
        if (isNavigating()) return;
        window.dispatchEvent(new CustomEvent(HERO_EVENTS.arrive, { detail: { holdY: holdY() } }));
      }
    };

    const tl = (made.tl = pinnedTimeline(root, "240%", {
      onToggle: sync,
      onUpdate: watchArrival,
      ...(spacer ? { pinSpacer: spacer } : {}),
    }));
    tl.eventCallback("onUpdate", sync);
    tl.fromTo(
      dash,
      { y: startY, rotationX: 14, scale: 0.76 },
      { y: 0, rotationX: 0, scale: 1, ease: "power2.inOut", duration: 1 },
      0,
    )
      // autoAlpha: the faded copy is hidden too, so its buttons don't sit invisibly over the app
      .to(copy, { y: () => -window.innerHeight * 0.16, autoAlpha: 0, scale: 0.97, ease: "power1.in", duration: 0.45 }, 0)
      .fromTo(frame, { borderRadius: 18 }, { borderRadius: 0, duration: 0.2 }, 0.8)
      .to({}, { duration: HOLD });
    sync();

    return () => {
      dash.inert = false;
      html.removeAttribute("data-hero-app-live");
      window.dispatchEvent(new CustomEvent(HERO_EVENTS.cancel));
    };
  });

  return mm;
}

/* ------------------------------------------------------------------ */
/* 2. Documents become prepared entries                                 */
/* ------------------------------------------------------------------ */

function layoutDocConnectors(stage: HTMLElement) {
  const inv = $(stage, '[data-doc="invoice"]');
  const panel = $(stage, "[data-panel]");
  if (!inv || !panel) return;
  const invBox = offsetWithin(inv, stage);
  const panelBox = offsetWithin(panel, stage);

  $$<SVGPathElement>(stage, "[data-connector]").forEach((path) => {
    const from = $(stage, `[data-field="${path.dataset.from}"]`);
    const to = $(stage, `[data-target="${path.dataset.to}"]`);
    if (!from || !to) return;
    const f = offsetWithin(from, stage);
    const t = offsetWithin(to, stage);
    const x1 = invBox.x + invBox.w;
    const y1 = f.y + f.h / 2;
    const x2 = panelBox.x;
    const y2 = t.y + t.h / 2;
    path.setAttribute("d", curve(x1, y1, x2, y2, 0.55));
    const port = $<SVGCircleElement>(stage, `[data-port="${path.dataset.from}"]`);
    port?.setAttribute("cx", String(x1));
    port?.setAttribute("cy", String(y1));
    const end = $<SVGCircleElement>(stage, `[data-end="${path.dataset.from}"]`);
    end?.setAttribute("cx", String(x2));
    end?.setAttribute("cy", String(y2));
  });
}

export function documentWorkflowAnimation(root: HTMLElement) {
  const mm = gsap.matchMedia();

  mm.add(MEDIA.desktop, () => {
    revealHeading(root);
    const stage = $(root, "[data-desktop] [data-stage]");
    if (!stage) return;
    const stopLayout = onRefreshInit(() => layoutDocConnectors(stage));

    const W = stage.offsetWidth;
    const H = stage.offsetHeight;
    const doc = (k: string) => $(stage, `[data-doc="${k}"]`)!;

    // Where each document comes from, where it gathers in the centre, and its arc.
    const plan = [
      { el: doc("statement"), start: { dx: -760, dy: 220, r: -28 }, cluster: { x: W * 0.4, y: H * 0.56, r: -11 }, bend: { x: -40, y: -160 } },
      { el: doc("receipt"), start: { dx: -120, dy: 620, r: 22 }, cluster: { x: W * 0.455, y: H * 0.5, r: -4 }, bend: { x: -180, y: 40 } },
      { el: doc("pdf"), start: { dx: 640, dy: -520, r: 26 }, cluster: { x: W * 0.6, y: H * 0.46, r: 8 }, bend: { x: 160, y: 60 } },
      { el: doc("invoice"), start: { dx: 820, dy: 160, r: 14 }, cluster: { x: W * 0.52, y: H * 0.5, r: 2 }, bend: { x: 40, y: -180 } },
    ];

    const tl = pinnedTimeline(root, "320%");

    // 1. Documents arrive from different directions and gather in the centre
    plan.forEach((p, i) => {
      const b = offsetWithin(p.el, stage);
      const c = { x: p.cluster.x - (b.x + b.w / 2), y: p.cluster.y - (b.y + b.h / 2) };
      const s = { x: c.x + p.start.dx, y: c.y + p.start.dy };
      const m = { x: (s.x + c.x) / 2 + p.bend.x, y: (s.y + c.y) / 2 + p.bend.y };
      const at = i * 0.28;
      tl.fromTo(
        p.el,
        { rotation: p.start.r, scale: 0.86 },
        {
          motionPath: { path: [s, m, c], curviness: 1.25 },
          rotation: p.cluster.r,
          scale: 0.9,
          ease: "power3.out",
          duration: 2,
        },
        at,
      ).fromTo(p.el, { opacity: 0 }, { opacity: 1, duration: 0.5 }, at);
    });

    // 2. The invoice is selected; the rest settle into a stack behind it
    plan.forEach((p) => {
      const isInvoice = p.el.dataset.doc === "invoice";
      tl.to(
        p.el,
        { x: 0, y: 0, rotation: Number(p.el.dataset.rot || 0), scale: 1, ease: "power2.inOut", duration: 1.1 },
        isInvoice ? 2.75 : 2.6,
      );
    });
    tl.fromTo($(stage, "[data-select-ring]"), { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: 0.5 }, 3.6).fromTo(
      $(stage, "[data-select-chip]"),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4 },
      3.7,
    );

    // 3. Key fields are highlighted
    const order = ["supplier", "trn", "number", "date", "subtotal", "vat", "total"];
    const hls = order.map((f) => $(stage, `[data-hl="${f}"]`)).filter(Boolean);
    tl.fromTo(hls, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.4, stagger: 0.15, ease: "power2.out" }, 4.0);

    // 4. The prepared entry panel opens
    tl.fromTo($(stage, "[data-panel]"), { opacity: 0, x: 70 }, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out" }, 4.5);

    // 5. Extracted values travel along the connectors into the entry
    $$<SVGPathElement>(stage, "[data-connector]").forEach((path, i) => {
      const key = path.dataset.from!;
      const target = $(stage, `[data-target="${path.dataset.to}"]`);
      const dot = $(stage, `[data-dot="${key}"]`);
      const t = 5.4 + i * 0.3;
      tl.fromTo($(stage, `[data-port="${key}"]`), { opacity: 0 }, { opacity: 1, duration: 0.15 }, t - 0.1)
        .fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: "power1.inOut" }, t)
        .fromTo(dot, { opacity: 0 }, { opacity: 1, duration: 0.08 }, t)
        .to(dot, { motionPath: { path, autoRotate: false }, duration: 0.6, ease: "power1.inOut" }, t)
        .to(dot, { opacity: 0, duration: 0.12 }, t + 0.58)
        .fromTo($(stage, `[data-end="${key}"]`), { opacity: 0 }, { opacity: 1, duration: 0.1 }, t + 0.55);
      if (target) {
        tl.fromTo($$(target, "[data-skeleton]"), { opacity: 1 }, { opacity: 0, duration: 0.2 }, t + 0.5)
          .fromTo($$(target, "[data-value]"), { opacity: 0, y: 5 }, { opacity: 1, y: 0, duration: 0.3 }, t + 0.52)
          .fromTo(
            target,
            { backgroundColor: "rgba(3, 63, 254, 0.14)" },
            { backgroundColor: "rgba(3, 63, 254, 0)", duration: 0.7, immediateRender: false },
            t + 0.55,
          );
      }
    });

    // 6. Totals, VAT treatment and the review status
    tl.fromTo($$(stage, "[data-entry-extra]"), { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.12 }, 7.9)
      .fromTo($(stage, "[data-status-processing]"), { opacity: 1, y: 0 }, { opacity: 0, y: -6, duration: 0.3 }, 8.7)
      .fromTo($(stage, "[data-status-ready]"), { opacity: 0, y: 6, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(2)" }, 8.8)
      .fromTo($(stage, "[data-panel-glow]"), { opacity: 0 }, { opacity: 1, duration: 0.4 }, 8.8)
      .to({}, { duration: 1 }, 9.2);

    return stopLayout;
  });

  mm.add(MEDIA.desktopStatic, () => staticLayout(root, layoutDocConnectors));

  mm.add(MEDIA.mobile, () => {
    revealHeading(root);
    const scene = $(root, "[data-mobile]");
    if (!scene) return;
    const stage = $(scene, "[data-stage]");
    if (!stage) return;

    // "Scan to ledger": the scene holds while a scan line reads the invoice top to bottom. Each field it reaches lifts
    // off as a chip and drops into its ledger slot. Only the scene pins, not the section: the heading scrolls past
    // first, so the invoice and ledger get the whole screen (on an iPhone in Safari, about 660px tall, they were drawn
    // at 58% when the heading had to share it).
    const doc = $(stage, "[data-scan-doc]");
    const line = $(stage, "[data-scan-line]");
    const count = $(stage, "[data-scan-count]");
    if (!doc || !line) return;

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: scene, start: "top top", end: "+=200%", scrub: 0.7, pin: true, anticipatePin: 1, invalidateOnRefresh: true },
    });

    const SCAN_START = 0.8;
    const SCAN_LEN = 5.8;
    const pos = (el: HTMLElement) => offsetWithin(el, stage);

    tl.fromTo(line, { opacity: 0 }, { opacity: 1, duration: 0.3 }, SCAN_START - 0.3)
      .fromTo(line, { y: 0 }, { y: () => doc.offsetHeight, duration: SCAN_LEN }, SCAN_START)
      .to(line, { opacity: 0, duration: 0.3 }, SCAN_START + SCAN_LEN);

    // Field counter in the ledger header ("0 of 5 fields read" -> "5 of 5")
    const tally = { n: 0 };
    const renderCount = () => {
      if (count) count.textContent = String(Math.round(tally.n));
    };
    renderCount();

    $$(stage, "[data-chip]").forEach((chip, i) => {
      const key = chip.dataset.chip!;
      const field = $(stage, `[data-scan-field="${key}"]`);
      const slot = $(stage, `[data-slot="${key}"]`);
      if (!field || !slot) return;
      // When the scan line reaches the middle of this field
      const f = pos(field);
      const d = pos(doc);
      const t = SCAN_START + SCAN_LEN * ((f.y + f.h / 2 - d.y) / doc.offsetHeight);

      tl.fromTo($(field, "[data-hl]"), { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.25, ease: "power2.out" }, t)
        .fromTo(
          chip,
          { opacity: 0, scale: 0.9, x: () => pos(field).x - 9, y: () => pos(field).y - 3 },
          { opacity: 1, scale: 1, duration: 0.15 },
          t + 0.1,
        )
        .to(chip, { x: () => pos(slot).x - 9, y: () => pos(slot).y - 3, duration: 0.9, ease: "power2.inOut" }, t + 0.25)
        .fromTo($(slot, "[data-slot-skel]"), { opacity: 1 }, { opacity: 0, duration: 0.15 }, t + 1.05)
        .fromTo($(slot, "[data-slot-value]"), { opacity: 0 }, { opacity: 1, duration: 0.2 }, t + 1.05)
        .to(chip, { opacity: 0, duration: 0.15 }, t + 1.12)
        .to(tally, { n: i + 1, duration: 0.05, onUpdate: renderCount }, t + 1.12);
    });

    const end = SCAN_START + SCAN_LEN;
    tl.fromTo($(stage, "[data-ledger-foot]"), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4 }, end + 0.6)
      // The proposal joins the review queue (the app's Needs review chip)
      .fromTo(
        $(stage, "[data-stamp]"),
        { opacity: 0, scale: 1.5 },
        { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" },
        end + 1.1,
      )
      .to({}, { duration: 0.6 }, end + 1.6);

    return () => {
      if (count) count.textContent = "5";
    };
  });

  return mm;
}

/* ------------------------------------------------------------------ */
/* 3. Bank reconciliation                                               */
/* ------------------------------------------------------------------ */

function layoutReconLines(stage: HTMLElement) {
  const left = $(stage, "[data-bank-table]");
  const right = $(stage, "[data-doc-table]");
  if (!left || !right) return;
  const lb = offsetWithin(left, stage);
  const rb = offsetWithin(right, stage);
  $$<SVGPathElement>(stage, "[data-recon-line]").forEach((path) => {
    const a = $(stage, `[data-bank-row="${path.dataset.from}"]`);
    const b = $(stage, `[data-doc-row="${path.dataset.to}"]`);
    if (!a || !b) return;
    const ab = offsetWithin(a, stage);
    const bb = offsetWithin(b, stage);
    const x1 = lb.x + lb.w;
    const y1 = ab.y + ab.h / 2;
    const x2 = rb.x;
    const y2 = bb.y + bb.h / 2;
    path.setAttribute("d", curve(x1, y1, x2, y2, 0.5));
    $$<SVGCircleElement>(stage, `[data-line-end="${path.dataset.from}-${path.dataset.to}"]`).forEach((c, i) => {
      c.setAttribute("cx", String(i === 0 ? x1 : x2));
      c.setAttribute("cy", String(i === 0 ? y1 : y2));
    });
  });
}

export function reconciliationAnimation(root: HTMLElement) {
  const mm = gsap.matchMedia();

  mm.add(MEDIA.desktop, () => {
    revealHeading(root);
    const stage = $(root, "[data-desktop] [data-stage]");
    if (!stage) return;
    const stopLayout = onRefreshInit(() => layoutReconLines(stage));

    const bankRows = $$(stage, "[data-bank-row]");
    const docRows = $$(stage, "[data-doc-row]");
    const rowH = docRows.length > 1 ? docRows[1].offsetTop - docRows[0].offsetTop : 52;
    const shuffleY = (_: number, el: HTMLElement) => (Number(el.dataset.shuffle) - Number(el.dataset.idx)) * rowH;

    const tl = pinnedTimeline(root, "280%");

    // Rows arrive: bank lines from the left, documents from the right in their original order
    tl.fromTo(bankRows, { opacity: 0, x: -32 }, { opacity: 1, x: 0, duration: 0.7, stagger: 0.14, ease: "power2.out" }, 0.2)
      .fromTo(docRows, { opacity: 0, x: 32, y: shuffleY }, { opacity: 1, x: 0, y: shuffleY, duration: 0.7, stagger: 0.12, ease: "power2.out" }, 1.0)
      // ...then slide into line with the bank transaction they settle
      .to(docRows, { y: 0, duration: 1.5, stagger: 0.05, ease: "power3.inOut" }, 2.9);

    const lines = $$<SVGPathElement>(stage, "[data-recon-line]");
    const pair = (from: string, to: string, attr: string) =>
      $$(stage, `[${attr}="${from}"], [${attr}="${to}"]`);

    // Confident matches connect one by one
    lines
      .filter((l) => l.dataset.kind === "match")
      .forEach((line, i) => {
        const { from = "", to = "" } = line.dataset;
        const t = 4.7 + i * 0.5;
        tl.fromTo($$(stage, `[data-line-end="${from}-${to}"]`), { opacity: 0 }, { opacity: 1, duration: 0.1 }, t)
          .fromTo(line, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: "power1.inOut" }, t)
          .fromTo(pair(from, to, "data-tint"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, t + 0.4)
          .fromTo(pair(from, to, "data-ind"), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.5)" }, t + 0.42);
      });

    // Uncertain and missing items are flagged, not guessed
    const candidates = lines.filter((l) => l.dataset.kind === "candidate");
    tl.fromTo(candidates, { opacity: 0 }, { opacity: 1, duration: 0.4, stagger: 0.15 }, 7.0)
      .fromTo($$(stage, '[data-line-end^="b5-"]'), { opacity: 0 }, { opacity: 1, duration: 0.2 }, 7.0)
      .fromTo($$(stage, '[data-tint="b5"], [data-tint="d5"], [data-tint="d6"]'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 7.15)
      .fromTo($$(stage, '[data-ind="b5"], [data-ind="d5"], [data-ind="d6"]'), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.5)" }, 7.2)
      .fromTo($$(stage, '[data-tint="b6"]'), { opacity: 0 }, { opacity: 1, duration: 0.3 }, 7.55)
      .fromTo($$(stage, '[data-ind="b6"]'), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2.5)" }, 7.6)
      // The accountant's review panel
      .fromTo($(stage, "[data-review-panel]"), { opacity: 0, y: 48 }, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 8.1)
      .fromTo($$(stage, "[data-review-item]"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.15 }, 8.45)
      .to({}, { duration: 1 }, 9.1);

    return stopLayout;
  });

  mm.add(MEDIA.desktopStatic, () => staticLayout(root, layoutReconLines));

  mm.add(MEDIA.mobile, () => {
    revealHeading(root);
    const scene = $(root, "[data-mobile]");
    if (!scene) return;
    // "Zip the books": as the rows scroll through, each bank line and its document
    // slide in from opposite edges and zip together; the unreconciled amount counts down.
    const rowsWrap = $(scene, "[data-zip-rows]");
    const rows = $$(scene, "[data-zip-row]");
    const amountEl = $(scene, "[data-zip-amount]");
    const bar = $(scene, "[data-zip-bar]");
    const tray = $(scene, "[data-zip-tray]");
    const total = Number(scene.dataset.total);
    const final = Number(scene.dataset.final);
    if (!rowsWrap || !rows.length || !amountEl || !bar || !tray || !total) return;

    const tally = { v: total };
    const render = () => {
      amountEl.textContent = aed(tally.v);
    };
    render();

    // From the rows' top at 85% (just above the tab bar) to the tray's top at 80%, so the tray fades in as it rises
    // above the tab bar. Ending on the rows (their bottom at 40%) left the tray invisible until it was halfway up the
    // screen: a blank gap under the rows (L15).
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: rowsWrap, start: "top 85%", endTrigger: tray, end: "top 80%", scrub: 0.6 },
    });

    let remaining = total;
    rows.forEach((row, i) => {
      const t = i;
      const before = remaining;
      remaining -= Number(row.dataset.amount);
      tl.fromTo($(row, "[data-zip-left]"), { xPercent: -105, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, t)
        .fromTo($(row, "[data-zip-right]"), { xPercent: 105, opacity: 0 }, { xPercent: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, t)
        .fromTo($(row, "[data-zip-check]"), { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2.5)" }, t + 0.72)
        .fromTo(tally, { v: before }, { v: remaining, duration: 0.5, onUpdate: render, immediateRender: false }, t + 0.7)
        .fromTo(
          bar,
          { scaleX: (total - before) / total },
          { scaleX: (total - remaining) / total, duration: 0.5, immediateRender: i === 0 },
          t + 0.7,
        );
    });

    // What could not be matched drops into the accountant's tray
    tl.fromTo(tray, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, rows.length + 0.1).fromTo(
      $$(scene, "[data-zip-exception]"),
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.2 },
      rows.length + 0.35,
    );

    return () => {
      amountEl.textContent = aed(final);
    };
  });

  return mm;
}

/* ------------------------------------------------------------------ */
/* 4. Accountant approval                                               */
/* ------------------------------------------------------------------ */

/**
 * Write the app's decision record in, section by section: its label, then the text uncovered left to right. The record
 * is longer than its card, so the body scrolls (it sits bottom-aligned when finished) to keep the section being written
 * in view. Sections with data-ap-hl light up those fields on the document. Returns the time after the last section.
 */
function writeRecord(tl: gsap.core.Timeline, stage: HTMLElement, start: number, gap: number) {
  const win = $(stage, "[data-ap-record-window]");
  const body = $(stage, "[data-ap-record-body]");
  const sections = $$(stage, "[data-ap-section]");
  if (!win || !body || !sections.length) return start;
  const overflow = () => Math.max(0, body.offsetHeight - win.clientHeight);
  // The body's y that shows section i whole (y = overflow shows the top; y = 0 is the finished, bottom-aligned record)
  const yFor = (i: number) => () => {
    const b = offsetWithin(sections[i], body);
    return Math.max(0, overflow() - Math.max(0, b.y + b.h - win.clientHeight));
  };
  tl.fromTo(body, { y: overflow }, { y: yFor(0), duration: 0.01 }, start - 0.02);
  sections.forEach((section, i) => {
    const t = start + i * gap;
    tl.to(body, { y: yFor(i), duration: gap * 0.6, ease: "power2.inOut" }, t)
      .fromTo($(section, "[data-ap-section-label]"), { opacity: 0 }, { opacity: 1, duration: 0.2 }, t)
      .fromTo($(section, "[data-ap-cover]"), { scaleX: 1 }, { scaleX: 0, duration: gap * 0.8, ease: "power1.inOut" }, t + 0.05);
    const fields = (section.dataset.apHl || "").split(" ").filter(Boolean);
    const boxes = fields.map((f) => $(stage, `[data-ap-doc] [data-hl="${f}"]`)).filter(Boolean);
    if (boxes.length) tl.fromTo(boxes, { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.4 }, t + 0.1);
  });
  return start + sections.length * gap;
}

export function approvalAnimation(root: HTMLElement) {
  const mm = gsap.matchMedia();

  mm.add(MEDIA.desktop, () => {
    revealHeading(root);
    const stage = $(root, "[data-desktop] [data-stage]");
    if (!stage) return;
    const docEl = $(stage, "[data-ap-doc]")!;
    const cursor = $(stage, "[data-ap-cursor]")!;
    const approve = $(stage, "[data-ap-approve]")!;
    const W = stage.offsetWidth;

    const docCenterShift = () => {
      const b = offsetWithin(docEl, stage);
      return W / 2 - (b.x + b.w / 2);
    };
    const btn = () => {
      const b = offsetWithin(approve, stage);
      return { x: b.x + b.w * 0.55, y: b.y + b.h * 0.55 };
    };

    const tl = pinnedTimeline(root, "300%");

    // The source document moves beside its decision record; the actions follow
    tl.fromTo(docEl, { x: docCenterShift, scale: 1.05 }, { x: 0, scale: 1, duration: 1.3, ease: "power3.inOut" }, 0.1)
      .fromTo($(stage, "[data-ap-panel]"), { opacity: 0, x: 60 }, { opacity: 1, x: 0, duration: 1, ease: "power3.out" }, 0.7)
      .fromTo($(stage, "[data-ap-actions]"), { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.9, ease: "power3.out" }, 1.0);

    // The decision record writes itself in, section by section, lighting up the document where it relies on it
    const t0 = writeRecord(tl, stage, 1.7, 0.6) + 0.3;

    // A person approves (and saves it as a precedent)
    tl.fromTo(
      cursor,
      { opacity: 0, x: () => W - 120, y: () => stage.offsetHeight - 20 },
      { opacity: 1, x: () => btn().x, y: () => btn().y, duration: 1.3, ease: "power2.inOut" },
      t0,
    )
      .fromTo($(stage, "[data-ap-approve-hover]"), { opacity: 0 }, { opacity: 1, duration: 0.15 }, t0 + 1.15)
      .to(cursor, { scale: 0.82, duration: 0.12, transformOrigin: "10% 10%" }, t0 + 1.4)
      .to(approve, { scale: 0.96, duration: 0.12 }, t0 + 1.4)
      .to(cursor, { scale: 1, duration: 0.15 }, t0 + 1.52)
      .to(approve, { scale: 1, duration: 0.15 }, t0 + 1.52)
      .fromTo($(stage, "[data-ap-approve-label]"), { opacity: 1 }, { opacity: 0, duration: 0.2 }, t0 + 1.6)
      .fromTo($(stage, "[data-ap-approved-label]"), { opacity: 0 }, { opacity: 1, duration: 0.25 }, t0 + 1.7)
      .fromTo($(stage, "[data-ap-status-ready]"), { opacity: 1, y: 0 }, { opacity: 0, y: -6, duration: 0.25 }, t0 + 1.7)
      .fromTo($(stage, "[data-ap-status-approved]"), { opacity: 0, y: 6, scale: 0.85 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "back.out(2)" }, t0 + 1.8)
      .fromTo($(stage, "[data-ap-audit-pending]"), { opacity: 1 }, { opacity: 0, duration: 0.2 }, t0 + 1.8)
      .fromTo($(stage, "[data-ap-audit-done]"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, t0 + 1.9)
      .fromTo($(stage, "[data-ap-toast]"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0 + 2.3)
      .to(cursor, { opacity: 0, x: "+=40", y: "+=30", duration: 0.5 }, t0 + 2.9)
      .to({}, { duration: 1 }, t0 + 3.4);
  });

  mm.add(MEDIA.mobile, () => {
    revealHeading(root);
    const scene = $(root, "[data-mobile]");
    if (!scene) return;
    // The tabs themselves (and the tap-to-approve moment) live in ApprovalWorkflow's MobileScene.
    revealItems(scene);
  });

  return mm;
}

/* ------------------------------------------------------------------ */
/* 4d. Client portal: the client answers and snaps the invoice          */
/* ------------------------------------------------------------------ */

/**
 * The conversation gains the client's reply, then oneth's re-proposal, newest first: the older entries start higher by
 * the new ones' height and move down as each arrives. Returns nothing; `t1` and `t2` are the two arrivals.
 */
function growConversation(tl: gsap.core.Timeline, scope: HTMLElement, t1: number, t2: number) {
  const onethMsg = $(scope, '[data-pt-msg="oneth"]');
  const reply = $(scope, '[data-pt-msg="client"]');
  const ask = $(scope, '[data-pt-msg="ask"]');
  if (!onethMsg || !reply || !ask) return;
  const s1 = () => onethMsg.offsetHeight;
  const s2 = () => reply.offsetHeight;
  tl.fromTo(ask, { y: () => -(s1() + s2()) }, { y: () => -s1(), duration: 0.5, ease: "power2.inOut" }, t1)
    .fromTo(reply, { y: () => -s1(), opacity: 0 }, { y: () => -s1(), opacity: 1, duration: 0.4 }, t1 + 0.15)
    .to([reply, ask], { y: 0, duration: 0.5, ease: "power2.inOut" }, t2)
    .fromTo(onethMsg, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, t2 + 0.5)
    .fromTo($(onethMsg, "[data-pt-glow]"), { opacity: 0 }, { opacity: 1, duration: 0.3 }, t2 + 0.55)
    .to($(onethMsg, "[data-pt-glow]"), { opacity: 0, duration: 0.6 }, t2 + 1.4);
}

/** The answer is typed word by word and Send answer wakes up. */
function typeAnswer(tl: gsap.core.Timeline, scope: HTMLElement, t: number) {
  tl.fromTo($$(scope, "[data-pt-word]"), { opacity: 0 }, { opacity: 1, duration: 0.01, stagger: 0.09 }, t)
    .fromTo($(scope, "[data-pt-send-off]"), { opacity: 0.5 }, { opacity: 0, duration: 0.2 }, t + 0.1)
    .fromTo($(scope, "[data-pt-send]"), { opacity: 0 }, { opacity: 1, duration: 0.2 }, t + 0.1);
}

/**
 * The photo is attached: the button gives way to the attachment row. They share one spot, so the row only starts once
 * the button is gone: overlapping, a visitor who stops scrolling mid-swap sees both texts on top of each other (L15).
 */
function attachPhoto(tl: gsap.core.Timeline, scope: HTMLElement, t: number) {
  tl.fromTo($(scope, "[data-pt-attach]"), { opacity: 1 }, { opacity: 0, duration: 0.2 }, t).fromTo(
    $(scope, "[data-pt-attached]"),
    { opacity: 0, y: 6 },
    { opacity: 1, y: 0, duration: 0.35, ease: "back.out(2)" },
    t + 0.2,
  );
}

export function portalAnimation(root: HTMLElement) {
  const mm = gsap.matchMedia();

  mm.add(MEDIA.desktop, () => {
    revealHeading(root);
    const stage = $(root, "[data-desktop] [data-stage]");
    if (!stage) return;
    const screen = $(stage, "[data-pt-screen]")!;
    const wrap = $(stage, "[data-pt-scale]")!;
    const tap = $(stage, "[data-pt-tap]")!;
    const form = $(stage, "[data-pt-form]")!;
    const inner = $(stage, "[data-pt-form-inner]")!;
    const camera = $(stage, "[data-pt-camera]")!;
    const scroller = $(stage, "[data-pt-scroll]")!;
    const scale = Number(wrap.dataset.ptScale) || 1;
    const TAP = 20; // half the tap ring

    // While the form is open the page is taller than the screen: it scrolls up by this much (in page pixels)
    const scrollBy = () => {
      const room = (screen.clientHeight - offsetWithin(wrap, screen).y) / scale;
      return Math.max(0, scroller.offsetHeight - room + 16);
    };
    // Where a tap lands: portal elements are inside the scaled (and maybe scrolled) page, the camera's shutter is not
    const inPortal = (sel: string, scrolled = true) => () => {
      const w = offsetWithin(wrap, screen);
      const b = offsetWithin($(stage, sel)!, wrap);
      const dy = scrolled ? scrollBy() : 0;
      return { x: w.x + (b.x + b.w / 2) * scale - TAP, y: w.y + (b.y + b.h / 2 - dy) * scale - TAP };
    };
    const onScreen = (sel: string) => () => {
      const b = offsetWithin($(stage, sel)!, screen);
      return { x: b.x + b.w / 2 - TAP, y: b.y + b.h / 2 - TAP };
    };
    const tapAt = (where: () => { x: number; y: number }, t: number) =>
      tl
        .fromTo(tap, { x: () => where().x, y: () => where().y, opacity: 0, scale: 0.6 }, { x: () => where().x, y: () => where().y, opacity: 1, scale: 1, duration: 0.12 }, t)
        .to(tap, { opacity: 0, scale: 1.5, duration: 0.3 }, t + 0.15);

    // The phone and the firm's app arrive with the section (not scrubbed, so the pinned frame is never empty)
    gsap.fromTo(
      [$(stage, "[data-pt-phone]"), $(stage, "[data-pt-app]")],
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.12, scrollTrigger: { trigger: root, start: "top 70%", toggleActions: "play none none reverse" } },
    );

    const tl = pinnedTimeline(root, "280%");
    // The client answers in words (the page scrolls to the answer field)…
    tl.fromTo(scroller, { y: 0 }, { y: () => -scrollBy(), duration: 0.5, ease: "power2.inOut" }, 0.4);
    tapAt(inPortal("[data-pt-textarea]"), 0.9);
    typeAnswer(tl, stage, 1.1);

    // …photographs the invoice…
    tapAt(inPortal("[data-pt-attach]"), 2.2);
    tl.fromTo(camera, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 2.35)
      // the camera finds the invoice: the focus box closes in, then dims
      .fromTo($(stage, "[data-pt-focus]"), { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: "power2.out" }, 2.55)
      .to($(stage, "[data-pt-focus]"), { opacity: 0.45, duration: 0.2 }, 2.85);
    tapAt(onScreen("[data-pt-shutter]"), 2.95);
    tl.fromTo($(stage, "[data-pt-flash]"), { opacity: 0 }, { opacity: 1, duration: 0.06 }, 3.1)
      .to($(stage, "[data-pt-flash]"), { opacity: 0, duration: 0.25 }, 3.16)
      .to(camera, { autoAlpha: 0, duration: 0.25 }, 3.4);
    attachPhoto(tl, stage, 3.5);

    // …and sends. The portal swaps the form for its thank-you, as the app does
    tapAt(inPortal("[data-pt-send]"), 4.0);
    tl.to(scroller, { y: 0, duration: 0.45, ease: "power2.inOut" }, 4.2);
    tl.fromTo(form, { height: () => inner.offsetHeight, opacity: 1 }, { height: 0, opacity: 0, duration: 0.45, ease: "power2.inOut" }, 4.2).fromTo(
      $(stage, "[data-pt-answered]"),
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2)" },
      4.45,
    );

    // The firm sees it: the question is Answered, the reply arrives, then oneth's proposal from the invoice
    tl.fromTo($$(stage, "[data-pt-req-before]"), { opacity: 1 }, { opacity: 0, duration: 0.2 }, 4.7).fromTo(
      $$(stage, "[data-pt-req-after]"),
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" },
      4.8,
    );
    growConversation(tl, stage, 4.8, 5.7);
    tl.to({}, { duration: 1 }, 6.9);
  });

  // Phones and tablets: no pin, and no change of height (the page below must not move while it plays). The form stays
  // open with the answer in it, and the thank-you takes the Send button's place.
  mm.add(MEDIA.mobile, () => {
    revealHeading(root);
    const scene = $(root, "[data-mobile]");
    const card = scene ? $(scene, "[data-pt-card]") : null;
    const form = scene ? $(scene, "[data-pt-form]") : null;
    const inner = scene ? $(scene, "[data-pt-form-inner]") : null;
    const talk = scene ? $(scene, "[data-pt-conversation]") : null;
    if (!scene || !card || !form || !inner || !talk) return;
    gsap.set(form, { height: "auto", opacity: 1 });
    gsap.set($(scene, "[data-pt-answered]"), { opacity: 0 });
    const answer = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: card, start: "top 60%", end: "bottom 45%", scrub: 0.6, invalidateOnRefresh: true },
    });
    typeAnswer(answer, scene, 0);
    attachPhoto(answer, scene, 1.2);
    answer
      .to($(scene, "[data-pt-send]"), { scale: 0.96, duration: 0.1 }, 1.8)
      .to($(scene, "[data-pt-send]"), { scale: 1, duration: 0.1 }, 1.9)
      .to($(scene, "[data-pt-send]"), { opacity: 0, duration: 0.2 }, 2.0)
      .fromTo($(scene, "[data-pt-answered-inline]"), { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)" }, 2.1);
    const firmSide = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: talk, start: "top 75%", end: "bottom 60%", scrub: 0.6, invalidateOnRefresh: true },
    });
    growConversation(firmSide, scene, 0, 1);
  });

  return mm;
}

/* ------------------------------------------------------------------ */
/* 4f. The capacity check, before the form                              */
/* ------------------------------------------------------------------ */

/** The capacity check: heading and card reveal; the numbers themselves are React state. */
export function capacityAnimation(root: HTMLElement) {
  const mm = gsap.matchMedia();
  mm.add(MEDIA.motion, () => {
    revealHeading(root);
    revealItems(root);
  });
  return mm;
}

/* ------------------------------------------------------------------ */
/* 5. Features and 6. Pilot: staggered reveals                          */
/* ------------------------------------------------------------------ */

export function featuresAnimation(root: HTMLElement) {
  const mm = gsap.matchMedia();
  mm.add(MEDIA.motion, () => {
    revealHeading(root);
    const cards = $$(root, "[data-feature]");
    gsap.set(cards, { opacity: 0, y: 44 });
    ScrollTrigger.batch(cards, {
      start: "top 88%",
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: 0.09, ease: "expo.out", overwrite: true }),
      onLeaveBack: (els) => gsap.to(els, { opacity: 0, y: 44, duration: 0.4, overwrite: true }),
    });
    revealItems(root);
  });
  return mm;
}

export function pilotAnimation(root: HTMLElement) {
  const mm = gsap.matchMedia();
  mm.add(MEDIA.motion, () => {
    revealHeading(root);
    revealItems(root);
  });
  return mm;
}
