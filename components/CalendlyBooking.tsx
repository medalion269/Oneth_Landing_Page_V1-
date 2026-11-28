"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import "./calendly-booking.css";

/**
 * Calendly booking window: Calendly's inline scheduler inside our own card over a dimmed page.
 * Phones: a sheet rising from the bottom. From 640px: a 680px card in the middle.
 * No API key or account connection is needed: it uses Calendly's public embed script (widget.js) and listens for
 * Calendly's postMessage events (page height, event scheduled). Styles live in calendly-booking.css (classes cb-*).
 */

/** The pilot call on Calendly (20 minutes). Change it here only: everything else uses calendlyUrl(). */
export const CALENDLY_URL = "https://calendly.com/oneth/oneth-pilot-call";
const SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";

export type Prefill = { name?: string; email?: string };

type CalendlyApi = {
  initInlineWidget: (o: { url: string; parentElement: HTMLElement }) => void;
};

/**
 * The booking link with the visitor's details. Prefill travels in the query string (Calendly's documented prefill):
 * the script's own `prefill` option was ignored when tested. encodeURIComponent, not URLSearchParams: Calendly's
 * script re-encodes the link, and a "+" for a space then reaches the booking form as a literal "+".
 */
export function calendlyUrl(prefill?: Prefill, embed = false): string {
  const qs = [
    prefill?.name && `name=${encodeURIComponent(prefill.name)}`,
    prefill?.email && `email=${encodeURIComponent(prefill.email)}`,
    // Inside our window the header already names the call and its length, so the calendar comes first.
    embed && "hide_event_type_details=1&hide_gdpr_banner=1",
  ]
    .filter(Boolean)
    .join("&");
  return qs ? `${CALENDLY_URL}?${qs}` : CALENDLY_URL;
}

let loading: Promise<CalendlyApi> | null = null;

/** Loads Calendly's widget.js once for the whole page. */
function loadCalendly(): Promise<CalendlyApi> {
  const w = window as unknown as { Calendly?: CalendlyApi };
  if (w.Calendly) return Promise.resolve(w.Calendly);
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.onload = () => (w.Calendly ? resolve(w.Calendly) : reject(new Error("Calendly did not load")));
    s.onerror = () => {
      loading = null;
      reject(new Error("Calendly did not load"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Most of the empty band Calendly leaves under its content (about 100px); the frame runs this far past the edge. */
const CALENDLY_BOTTOM_PADDING = 56;
/** Calendly's compact calendar step, so the first paint is already the right size. */
const FIRST_HEIGHT = 602;
/** After this long without the calendar, the loading state also offers the booking page. */
const SLOW_MS = 12000;
/** Calendly reports its height about a second after its frame loads; this is the longest we wait for that. */
const REVEAL_MS = 5000;

type LoadState = "loading" | "slow" | "ready" | "failed";

function CloseIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * Calendly's inline scheduler, started from code (initInlineWidget) so it works when it appears after the page loaded.
 * It sizes itself to Calendly's content (`calendly.page_height`), hides Calendly's empty bottom band, and shows our own
 * loading and failure states (Calendly's widget.css is not loaded).
 */
function CalendlyScheduler({ prefill, onBooked }: { prefill?: Prefill; onBooked?: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const name = prefill?.name;
  const email = prefill?.email;
  const [height, setHeight] = useState(FIRST_HEIGHT);
  const [state, setState] = useState<LoadState>("loading");
  const booked = useRef(onBooked);
  useEffect(() => {
    booked.current = onBooked;
  });

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== "https://calendly.com") return;
      const data = e.data as { event?: unknown; payload?: { height?: unknown } } | null;
      if (data?.event === "calendly.event_scheduled") booked.current?.();
      if (data?.event === "calendly.page_height") {
        const px = parseFloat(String(data.payload?.height));
        // The first report, while the frame is still empty, is a couple of pixels.
        if (px > 200) {
          setHeight(px);
          setState("ready");
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let cancelled = false;
    let reveal = 0;
    const slow = window.setTimeout(() => setState((s) => (s === "loading" ? "slow" : s)), SLOW_MS);
    loadCalendly()
      .then((c) => {
        if (cancelled) return;
        el.replaceChildren();
        c.initInlineWidget({ url: calendlyUrl({ name, email }, true), parentElement: el });
        // Safety net: should the height message ever be missed, never keep a loaded calendar behind the loader.
        el.querySelector("iframe")?.addEventListener("load", () => {
          reveal = window.setTimeout(() => setState((s) => (s === "loading" || s === "slow" ? "ready" : s)), REVEAL_MS);
        });
      })
      .catch(() => {
        if (!cancelled) setState("failed");
      });
    return () => {
      cancelled = true;
      window.clearTimeout(slow);
      window.clearTimeout(reveal);
    };
  }, [name, email]);

  const waiting = state !== "ready";
  const fallback = calendlyUrl(prefill);
  return (
    // Its own height, shrinking (Calendly then scrolls inside its frame) on shorter screens. The hidden strip at the
    // bottom is always Calendly's empty band, so the last time slot and "Schedule Event" stay reachable.
    <div className="cb-scheduler" style={{ height: height - CALENDLY_BOTTOM_PADDING }}>
      <div ref={box} aria-hidden={waiting} style={{ height: `calc(100% + ${CALENDLY_BOTTOM_PADDING}px)` }} />
      {waiting && (
        <div role="status" className="cb-status">
          {state === "failed" ? (
            <div>
              <p className="cb-status-title">The calendar did not load.</p>
              <p className="cb-status-text">You can book the same call on Calendly&apos;s own page.</p>
              <a href={fallback} target="_blank" rel="noopener noreferrer" className="cb-btn">
                Open the booking page
              </a>
            </div>
          ) : (
            <div className="cb-loading">
              <span aria-hidden className="cb-spinner" />
              <p className="cb-status-text cb-loading-text">Loading available times</p>
              {state === "slow" && (
                <a href={fallback} target="_blank" rel="noopener noreferrer" className="cb-link cb-slow-link">
                  Taking a while? Open the booking page
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const SCROLL_KEYS = new Set([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"]);

/**
 * The booking window. Calendly's own popup is not used (its stylesheet sits off-centre with a loose scrollbar).
 * The page behind is held by cancelling wheel, touch and scroll keys, never `overflow: hidden` (that changes the page
 * width and makes scroll-driven animations such as GSAP ScrollTrigger recalculate). Escape, the close button or a click
 * on the dimmed page closes it. Once Calendly reports the booking, the header says so and Calendly's confirmation stays
 * in view until the visitor closes the window.
 */
export function CalendlyModal({
  open,
  onClose,
  prefill,
  onBooked,
  brand,
  title = "Book your pilot call",
  bookedTitle = "Your pilot call is booked",
  duration = "20 minutes",
}: {
  open: boolean;
  onClose: () => void;
  /** Fills Calendly's name and email fields. */
  prefill?: Prefill;
  /** Called once Calendly reports the booking. */
  onBooked?: () => void;
  /** Optional logo shown at the left of the header (an <svg> or <img>; it is sized to the header). */
  brand?: ReactNode;
  title?: string;
  bookedTitle?: string;
  duration?: string;
}) {
  const titleId = useId();
  const descId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [booked, setBooked] = useState(false);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    // Focus the window itself (Tab reaches the link and the close button), so no focus ring appears on open.
    panel.current?.focus({ preventScroll: true });
    const stop = (e: Event) => e.preventDefault();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return close.current();
      const onControl = (e.target as HTMLElement | null)?.closest?.("button, a, input, textarea, select");
      if ((e.key === " " || e.key === "Enter") && onControl) return;
      if (SCROLL_KEYS.has(e.key)) e.preventDefault();
    };
    window.addEventListener("wheel", stop, { passive: false });
    window.addEventListener("touchmove", stop, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchmove", stop);
      window.removeEventListener("keydown", onKey);
      before?.focus?.({ preventScroll: true });
    };
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const link = (text: string) => (
    <a href={calendlyUrl(prefill)} target="_blank" rel="noopener noreferrer" className="cb-link">
      {text}
    </a>
  );

  return createPortal(
    <div role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} className="cb-root">
      <div aria-hidden onClick={onClose} className="cb-backdrop" />
      <div ref={panel} tabIndex={-1} className="cb-window">
        <div className="cb-header">
          {brand && (
            <>
              <span className="cb-brand">{brand}</span>
              <span aria-hidden className="cb-divider" />
            </>
          )}
          <div className="cb-heading">
            <p id={titleId} className="cb-title">
              {booked ? bookedTitle : title}
            </p>
            <p id={descId} className={`cb-desc ${booked ? "cb-desc-wrap" : ""}`}>
              {booked ? (
                <>Invite sent{prefill?.email ? ` to ${prefill.email}` : ""}.</>
              ) : (
                <>
                  <span className="cb-only-phone">
                    {duration} · {link("Open in Calendly")}
                  </span>
                  <span className="cb-only-wide">
                    {duration}. Pick a time that suits you, or {link("open it in Calendly")}.
                  </span>
                </>
              )}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="cb-close">
            <CloseIcon />
          </button>
        </div>
        <CalendlyScheduler
          prefill={prefill}
          onBooked={() => {
            setBooked(true);
            onBooked?.();
          }}
        />
      </div>
    </div>,
    document.body,
  );
}

/**
 * Convenience: a self-contained trigger that owns the open state. Use it for plain "Book a call" buttons; give it the
 * page's own button classes. For a form that should open the window after a successful submit, use CalendlyModal
 * directly with your own `open` state and pass the submitted name and email as `prefill`.
 */
export function BookCallButton({
  className,
  children,
  prefill,
  brand,
  onBooked,
}: {
  className?: string;
  children: ReactNode;
  prefill?: Prefill;
  brand?: ReactNode;
  onBooked?: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <CalendlyModal open={open} onClose={() => setOpen(false)} prefill={prefill} brand={brand} onBooked={onBooked} />
    </>
  );
}
