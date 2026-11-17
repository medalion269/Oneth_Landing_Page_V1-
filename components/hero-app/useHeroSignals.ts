"use client";

/**
 * Signals from the hero's scroll scene (lib/animations.ts, HERO_EVENTS) and the reduced-motion preference.
 * `onReady` fires once per load, when the visitor has scrolled down onto the app (arrive) AND it fills the screen
 * (live), in either order: a visitor who pauses just short of flat makes it live before arriving.
 */

import { useEffect, useRef, useSyncExternalStore } from "react";
import { HERO_EVENTS } from "@/lib/animations";

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, () => window.matchMedia(REDUCED).matches, () => false);
}

export type HeroSignals = {
  /** The app fills the pinned screen (or stopped doing so). */
  onLive?: (live: boolean) => void;
  /** Arrived and live, once per load. */
  onReady?: () => void;
  /** The desktop scene was torn down (resized below 1024px, reduced motion turned on, unmount). */
  onCancel?: () => void;
};

/** Returns a ref holding the latest state: whether the app is live, and where it lies flat (to hold the page). */
export function useHeroSignals(handlers: HeroSignals) {
  const latest = useRef(handlers);
  useEffect(() => {
    latest.current = handlers;
  });
  const state = useRef({ live: false, flatY: 0 });

  useEffect(() => {
    let arrived = false;
    let ready = false;
    const check = () => {
      if (ready || !arrived || !state.current.live) return;
      ready = true;
      latest.current.onReady?.();
    };
    const onLive = (e: Event) => {
      const { live, holdY } = (e as CustomEvent<{ live: boolean; holdY: number }>).detail;
      state.current.live = live;
      if (holdY) state.current.flatY = holdY;
      latest.current.onLive?.(live);
      check();
    };
    const onArrive = (e: Event) => {
      arrived = true;
      state.current.flatY = (e as CustomEvent<{ holdY: number }>).detail.holdY;
      check();
    };
    const onCancel = () => {
      state.current.live = false;
      latest.current.onCancel?.();
    };
    window.addEventListener(HERO_EVENTS.live, onLive);
    window.addEventListener(HERO_EVENTS.arrive, onArrive);
    window.addEventListener(HERO_EVENTS.cancel, onCancel);
    return () => {
      window.removeEventListener(HERO_EVENTS.live, onLive);
      window.removeEventListener(HERO_EVENTS.arrive, onArrive);
      window.removeEventListener(HERO_EVENTS.cancel, onCancel);
    };
  }, []);

  return state;
}
