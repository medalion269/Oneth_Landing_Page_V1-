"use client";

/**
 * The hero story's state (lib/hero-story.ts) and the actions the screens call. Follow-up beats (the next invoice
 * arriving, the client answering from their phone) are scheduled from the click that causes them, never from an
 * effect, and belong to the app rather than the guide, so the story also plays when the visitor explores alone.
 */

import { useEffect, useMemo, useReducer, useRef } from "react";
import { INITIAL_WORLD, reduce, select, type ManaraBill, type StoryId } from "@/lib/hero-story";
import type { DecisionTab } from "@/lib/demo-data";
import type { RailSection } from "../app/ui";
import { useReducedMotion } from "./useHeroSignals";

export type GoOpts = { tab?: DecisionTab; period?: string | null; decision?: StoryId | null };

export function useStory() {
  const reduced = useReducedMotion();
  const [world, dispatch] = useReducer(reduce, INITIAL_WORLD);
  const view = useMemo(() => select(world), [world]);

  const timers = useRef<number[]>([]);
  useEffect(() => {
    const list = timers;
    return () => list.current.forEach((t) => window.clearTimeout(t));
  }, []);
  const later = (ms: number, fn: () => void) => {
    if (ms <= 0) return fn();
    timers.current.push(window.setTimeout(fn, ms));
  };

  const actions = {
    navigate: (to: RailSection, opts: GoOpts = {}) => dispatch({ type: "navigate", to, ...opts }),
    openDecision: (id: StoryId) => dispatch({ type: "navigate", to: "decisions", decision: id }),
    /** Approve the Desert Line invoice; a moment later the next one arrives and oneth proposes it by itself. */
    approveDesert: () => {
      dispatch({ type: "approve", id: "desert" });
      later(reduced ? 0 : 1300, () => dispatch({ type: "inv441-arrives" }));
    },
    approveInv441: () => dispatch({ type: "approve", id: "inv441" }),
    hideInv441: () => dispatch({ type: "hide-inv441" }),
    /** A person sends oneth's drafted question; the client answers from their phone with a photo. */
    sendRequest: () => {
      dispatch({ type: "send-request" });
      if (reduced) {
        dispatch({ type: "client-answers" });
        return;
      }
      later(350, () => dispatch({ type: "phone", stage: "question" }));
      later(1300, () => dispatch({ type: "phone", stage: "typing" }));
      later(3500, () => dispatch({ type: "phone", stage: "attached" }));
      later(4700, () => dispatch({ type: "phone", stage: "sent" }));
      later(6000, () => dispatch({ type: "client-answers" }));
    },
    approveBazaar: () => dispatch({ type: "approve", id: "bazaar" }),
    match: (bill: ManaraBill) => dispatch({ type: "match", bill }),
    dismissToast: (id: number) => dispatch({ type: "dismiss-toast", id }),
    ack: (key: string) => dispatch({ type: "ack", key }),
    reset: () => {
      timers.current.forEach((t) => window.clearTimeout(t));
      timers.current = [];
      dispatch({ type: "reset" });
    },
  };

  return { world, view, actions, reduced };
}

export type Story = ReturnType<typeof useStory>;
export type StoryActions = Story["actions"];
