"use client";

import { useRef } from "react";
import { ChevronDown, Lock } from "lucide-react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import Stage from "./Stage";
import { AppRail, AppTopBar, ICON_SM, PillTabs } from "./app/ui";
import { limitsAnimation, useGSAP } from "@/lib/animations";
import { PERMISSION_MODE_LABEL, limitStages, permissions, type PermissionMode } from "@/lib/demo-data";

/*
 * "You set the limits": the oneth app's Settings → Permissions (frontend/src/app/settings/SettingsPage.tsx). In the
 * pilot every action is Propose, so the team approves everything. As the months pass, partners let oneth decide routine,
 * low-value work on its own; requests and posting stay propose-only and tax returns are locked off. Markup is the Month 3
 * state; the timeline starts from the pilot month.
 */

const SHADOW_SENTENCE =
  "What oneth may decide on its own. Shadow mode: even an automatic decision is only proposed, and anything above the firm's materiality goes to a reviewer.";
const footnote = "Example settings. Only partners change them, and a change applies to the next decision.";

/** The mode pill and, for "Auto under a threshold", the AED limit, as the app's controls. */
function ModeControl({ mode, threshold, locked = false, compact = false }: { mode: PermissionMode; threshold?: string; locked?: boolean; compact?: boolean }) {
  return (
    <span className={`flex items-center gap-2 ${compact ? "flex-wrap" : "justify-end"}`}>
      <span
        className={`inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-paper px-4 text-[13px] font-semibold ${
          locked ? "text-muted" : "text-ink"
        }`}
      >
        {PERMISSION_MODE_LABEL[mode]}
        <ChevronDown {...ICON_SM} className="text-muted" />
      </span>
      {mode === "auto_under_threshold" && threshold && (
        <span className="flex items-center gap-2 text-[13px] text-muted">
          up to AED
          <span className="inline-flex h-9 w-24 items-center rounded-app-tile bg-paper px-3 text-ink tabular-nums">{threshold}</span>
        </span>
      )}
    </span>
  );
}

/** A row's control: rows that change hold both states stacked (Propose, then the partner's choice on top). */
function Control({ p, compact = false }: { p: (typeof permissions)[number]; compact?: boolean }) {
  if (!p.from) return <ModeControl mode={p.mode} threshold={p.threshold} locked={p.locked} compact={compact} />;
  return (
    <span data-limit-cell data-from={p.from} className={`stack ${compact ? "" : "justify-items-end"}`}>
      <span data-limit-before aria-hidden style={{ opacity: 0 }}>
        <ModeControl mode="propose" compact={compact} />
      </span>
      <span data-limit-after>
        <ModeControl mode={p.mode} threshold={p.threshold} compact={compact} />
      </span>
    </span>
  );
}

function Stepper({ compact = false }: { compact?: boolean }) {
  return (
    <div data-limit-stepper className={compact ? "" : "w-[640px]"}>
      <div className="relative grid grid-cols-3">
        <span aria-hidden className="absolute left-[16.667%] right-[16.667%] top-[7px] h-0.5 rounded-full bg-line" />
        <span data-limit-progress aria-hidden className="absolute left-[16.667%] right-[16.667%] top-[7px] h-0.5 origin-left rounded-full bg-accent" />
        {limitStages.map((s) => (
          <div key={s.id} className="relative flex flex-col items-center gap-2">
            <span className="stack">
              <span className="h-4 w-4 rounded-full border-2 border-line bg-paper" />
              <span data-limit-dot={s.id} className="h-4 w-4 rounded-full border-2 border-accent bg-accent ring-4 ring-accent-soft" />
            </span>
            <span className={`font-medium ${compact ? "text-[12px]" : "text-[13px]"}`}>{s.label}</span>
          </div>
        ))}
      </div>
      <div className={`stack mt-2 w-full text-center text-muted ${compact ? "text-[13px]" : "text-[13.5px]"}`}>
        {limitStages.map((s) => (
          <p key={s.id} data-limit-caption={s.id} className="text-balance" style={{ opacity: s.id === 3 ? 1 : 0 }}>
            <span className="sr-only">{s.label}: </span>
            {s.caption}
          </p>
        ))}
      </div>
    </div>
  );
}

const TABS = ["Permissions", "Team", "Branding", "Integrations", "Appearance"] as const;

function DesktopScene() {
  return (
    <Stage
      width={1200}
      height={600}
      label="The oneth app's Settings, Permissions tab, for a firm three months in. In the pilot month every action is Propose, so the team approves everything. By month 3, partners have set Classify routine expenses to automatic under AED 2,000, Match bank lines to automatic and Apply standard VAT to automatic under AED 1,000. Send routine requests and Post entries stay Propose, and Submit tax returns is locked off. In shadow mode even an automatic decision is only proposed."
    >
      <div className="absolute inset-0 flex flex-col items-center gap-3">
        <Stepper />
        <div
          data-limit-grid
          className="flex min-h-0 w-full flex-1 overflow-hidden rounded-[18px] border border-line bg-canvas font-app text-ink shadow-float antialiased"
        >
          <AppRail active="settings" badge={13} />
          <div className="flex min-w-0 flex-1 flex-col px-6 pb-5">
            <AppTopBar title="Settings" compact />
            <PillTabs items={TABS} active="Permissions" className="self-start" />
            <section className="mt-2 flex min-h-0 flex-1 flex-col gap-1.5 rounded-app-card bg-paper px-5 py-4 shadow-app">
              <p className="text-[15px] font-semibold leading-[22px]">Permissions</p>
              <p className="shrink-0 truncate text-[13px] leading-[18px] text-muted">{SHADOW_SENTENCE}</p>
              <div className="mt-1 flex flex-col gap-1">
                {permissions.map((p) => (
                  <div key={p.action} data-limit-row className="flex items-center gap-3 rounded-app-tile bg-line-soft px-4 py-1">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="flex items-center gap-2 text-[14px] font-semibold leading-[20px]">
                        {p.label}
                        {p.locked && <Lock {...ICON_SM} className="text-muted" />}
                      </span>
                      <span className="truncate text-[12px] leading-[16px] text-muted">{p.detail}</span>
                    </div>
                    <Control p={p} />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
        <p data-limit-note className="text-[11.5px] text-faint">
          {footnote}
        </p>
      </div>
    </Stage>
  );
}

/**
 * Phones: the same Permissions card, one row per action with its control underneath. The month stepper sticks to the
 * top while the card scrolls under it, so the month is in view when a row changes.
 */
function MobileScene() {
  return (
    <div data-mobile className="container-x mt-10 max-w-xl font-app antialiased lg:hidden">
      <div className="relative">
        <div data-reveal className="card sticky top-3 z-10 rounded-app-card! px-4 pb-4 pt-5 shadow-lift">
          <Stepper compact />
        </div>
        <div data-limit-grid className="mt-3 flex flex-col gap-2 rounded-app-card bg-paper p-4 shadow-app">
          <p className="text-[15px] font-semibold">Permissions</p>
          <p className="text-[13px] leading-[18px] text-muted">{SHADOW_SENTENCE}</p>
          {permissions.map((p) => (
            <div key={p.action} data-limit-row className="flex flex-col gap-2 rounded-app-tile bg-line-soft px-4 py-3">
              <div>
                <span className="flex items-center gap-2 text-[14px] font-semibold leading-[20px]">
                  {p.label}
                  {p.locked && <Lock {...ICON_SM} className="text-muted" />}
                </span>
                <span className="text-[13px] leading-[18px] text-muted">{p.detail}</span>
              </div>
              <Control p={p} compact />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 px-1 text-[12.5px] leading-relaxed text-muted">{footnote}</p>
    </div>
  );
}

export default function ApprovalLimits() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      const mm = limitsAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="limits" aria-labelledby="limits-title" className="relative py-24 sm:py-28 lg:flex lg:h-svh lg:flex-col lg:pb-5 lg:pt-20">
      <SectionHeading id="limits-title" eyebrow="You set the limits" title="Autonomy, earned one limit at a time." className="container-x" pinned>
        Your team approves everything in the pilot. Then your partners choose what <Brand className="font-medium text-ink" /> may decide on its own.
      </SectionHeading>
      <div data-desktop className="container-x mt-6 hidden min-h-0 flex-1 lg:block">
        <DesktopScene />
      </div>
      <MobileScene />
    </section>
  );
}
