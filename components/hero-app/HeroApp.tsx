"use client";

/**
 * The hero's clickable oneth app (desktop), where visitors do a client's work themselves: Saffron Grove's to-do list
 * (lib/hero-story.ts). Every screen reads the story's live state, so approving a decision moves the counts on the
 * Overview, Clients, the queue, Work and the period checklist together. Nothing is fetched, saved or sent.
 *
 * The scroll scene (lib/animations.ts) keeps the app `inert` until it fills the screen; the guide (Guide.tsx) invites
 * the visitor then, and walks them through the tasks one click at a time if they say yes.
 */

import { useRef } from "react";
import { OverviewGrid, type Go } from "../AccountingDashboard";
import { AppFrame, type RailSection } from "../app/ui";
import { ClientsScreen, CloseScreen, DecisionsScreen, KnowledgeScreen, PerformanceScreen, PeriodReview, SettingsScreen, WorkScreen } from "./screens";
import { DecisionScreen } from "./DecisionScreen";
import { GuideButton, GuideInvite, GuideOverlay, useGuide } from "./Guide";
import { Toasts } from "./Toasts";
import { useStory } from "./useStory";
import { SG_NOVEMBER, readyPeriod } from "@/lib/hero-story";

const TITLE: Record<RailSection, string> = {
  overview: "Overview",
  clients: "Clients",
  work: "Work",
  decisions: "Decisions",
  close: "Period close",
  knowledge: "Knowledge",
  performance: "Performance",
  settings: "Settings",
};

export default function HeroApp() {
  const story = useStory();
  const { world, view, actions } = story;
  const frameRef = useRef<HTMLDivElement>(null);
  const guide = useGuide({ story });
  const nav = world.nav;

  const go: Go = (to, opts) => actions.navigate(to, opts ?? {});
  const period = nav.period === SG_NOVEMBER ? view.november : nav.period ? readyPeriod(nav.period) : null;

  return (
    <AppFrame
      section={nav.screen}
      title={nav.decision ? "Decision" : TITLE[nav.screen]}
      badge={view.awaiting}
      onNavigate={(to) => go(to)}
      hint={<GuideButton guide={guide} />}
      overlay={
        <>
          <Toasts world={world} actions={actions} guiding={guide.status === "running"} />
          <GuideInvite guide={guide} />
          <GuideOverlay guide={guide} frameRef={frameRef} />
        </>
      }
      className="rounded-[18px] border border-line shadow-float"
      frameProps={{ "data-dash-frame": "", ref: frameRef }}
    >
      {/* Keyed so each screen fades in when it opens */}
      <div key={`${nav.screen}-${nav.period ?? ""}-${nav.decision ?? ""}`} className="app-screen-in h-full">
        {nav.screen === "overview" && <OverviewGrid go={go} view={view} />}
        {nav.screen === "clients" && <ClientsScreen view={view} />}
        {nav.screen === "work" && <WorkScreen view={view} />}
        {nav.screen === "decisions" &&
          (nav.decision ? (
            <DecisionScreen id={nav.decision} world={world} actions={actions} onBack={() => go("decisions", { tab: nav.tab })} />
          ) : (
            <DecisionsScreen tab={nav.tab} onTab={(tab) => go("decisions", { tab })} onOpen={actions.openDecision} view={view} />
          ))}
        {nav.screen === "close" &&
          (period ? <PeriodReview period={period} onBack={() => go("close")} /> : <CloseScreen view={view} onReview={(key) => go("close", { period: key })} />)}
        {nav.screen === "knowledge" && <KnowledgeScreen view={view} />}
        {nav.screen === "performance" && <PerformanceScreen />}
        {nav.screen === "settings" && <SettingsScreen />}
      </div>
    </AppFrame>
  );
}
