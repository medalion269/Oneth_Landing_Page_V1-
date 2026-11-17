"use client";

import { useRef } from "react";
import { ArrowUpRight, Lock } from "lucide-react";
import SectionHeading from "./SectionHeading";
import Stage from "./Stage";
import { CursorPointer } from "./icons";
import {
  AppCard,
  AppRail,
  AppTopBar,
  Chip,
  ICON,
  ICON_SM,
  PillButton,
  type Tone,
} from "./app/ui";
import { closeAnimation, useGSAP } from "@/lib/animations";
import {
  CHECKLIST_LABEL,
  aed,
  blockedAtStart,
  client,
  closeChecklist,
  closePeriod,
  depreciation,
  firm,
  type ChecklistStatus,
} from "@/lib/demo-data";

/*
 * Period close, "checklist, then sign-off": the oneth app's period detail (frontend/src/app/close/PeriodDetailPage.tsx).
 * October's close checklist (the engine's own items and wording) turns Done row by row; once nothing is blocked, a
 * partner signs off and the month is locked. Markup is the finished, signed-off state; the timeline starts from the
 * month as it stood when it ended.
 */

const TONE: Record<ChecklistStatus, Tone> = {
  ok: "done",
  warning: "review",
  blocked: "blocked",
};
const PENDING = `Signing off locks ${closePeriod.month} for ${client.name}, including oneth's proposed adjustments. Nothing is posted to the accounting system.`;
const REASON = `Sign-off waits for ${blockedAtStart} blocked checklist ${blockedAtStart === 1 ? "item" : "items"}.`;
const SIGNED = `${closePeriod.signedOffAt} · by you. The month is locked: its decisions can't change.`;

/** The period's status chip: In progress, then Ready for sign-off, then Signed off. */
function PeriodStatus({ align = "end" }: { align?: "start" | "end" }) {
  return (
    <span
      className={`stack ${align === "end" ? "justify-items-end" : "justify-items-start"}`}
    >
      <span data-close-status="progress" aria-hidden style={{ opacity: 0 }}>
        <Chip tone="progress">In progress</Chip>
      </span>
      <span data-close-status="ready" aria-hidden style={{ opacity: 0 }}>
        <Chip tone="review">Ready for sign-off</Chip>
      </span>
      <span data-close-status="signed">
        <Chip tone="done">Signed off</Chip>
      </span>
    </span>
  );
}

/**
 * One checklist row: the month-end state (detail, chip and the link to the work) under the finished one (Done). A done
 * item without a detail centres its label, as the app's shorter row would read.
 */
function ChecklistRow({
  item,
  compact = false,
}: {
  item: (typeof closeChecklist)[number];
  compact?: boolean;
}) {
  return (
    <li
      data-close-row
      {...(item.before.status === "blocked" ? { "data-blocked": "" } : {})}
      className="flex items-center justify-between gap-4 rounded-app-tile bg-line-soft px-4 py-2.5"
    >
      <span className="stack min-w-0">
        <span
          data-close-before
          aria-hidden
          className="flex flex-col gap-0.5"
          style={{ opacity: 0 }}
        >
          <span className="text-[14px] font-semibold leading-[20px]">
            {item.label}
          </span>
          <span className="text-[13px] leading-[18px] text-muted">
            {item.before.detail}
          </span>
        </span>
        <span data-close-after className="flex flex-col gap-0.5 self-center">
          <span className="text-[14px] font-semibold leading-[20px]">
            {item.label}
          </span>
          {item.after.detail && (
            <span className="text-[13px] leading-[18px] text-muted">
              {item.after.detail}
            </span>
          )}
        </span>
      </span>
      <span className="stack shrink-0 justify-items-end">
        <span
          data-close-before
          aria-hidden
          className="flex items-center gap-2"
          style={{ opacity: 0 }}
        >
          <Chip size="sm" tone={TONE[item.before.status]}>
            {CHECKLIST_LABEL[item.before.status]}
          </Chip>
          {!compact && (
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-paper text-ink">
              <ArrowUpRight {...ICON} />
            </span>
          )}
        </span>
        <span data-close-after className="flex h-9 items-center">
          <Chip size="sm" tone={TONE[item.after.status]}>
            {CHECKLIST_LABEL[item.after.status]}
          </Chip>
        </span>
      </span>
    </li>
  );
}

function Checklist({ compact = false }: { compact?: boolean }) {
  return (
    <ul className="flex flex-col gap-2">
      {closeChecklist.map((item) => (
        <ChecklistRow key={item.key} item={item} compact={compact} />
      ))}
    </ul>
  );
}

/** The Sign-off card: waiting (with the reason and the disabled button), then signed off and locked. */
function SignOffCard() {
  return (
    <AppCard title="Sign-off" data-close-signoff>
      <div className="stack w-full grid-cols-[minmax(0,1fr)]">
        {/* Waiting for sign-off: collapsed in the finished state, so the card is as short as the app's signed-off card */}
        <div
          data-close-pending
          aria-hidden
          className="overflow-hidden"
          style={{ height: 0, opacity: 0 }}
        >
          <div data-close-pending-inner className="flex flex-col gap-3">
            <p className="text-[14px] leading-[20px] text-muted">{PENDING}</p>
            <p
              data-close-reason
              className="rounded-app-tile bg-line-soft px-4 py-2.5 text-[13px] leading-[18px] text-muted"
            >
              {REASON}
            </p>
            <span className="stack">
              <PillButton
                data-close-btn-off
                className="w-full"
                style={{ opacity: 0 }}
              >
                Sign off
              </PillButton>
              <PillButton
                data-close-btn
                className="relative w-full overflow-hidden"
              >
                <span
                  data-close-btn-hover
                  aria-hidden
                  className="absolute inset-0 bg-white/12"
                  style={{ opacity: 0 }}
                />
                <span className="relative">Sign off</span>
              </PillButton>
            </span>
          </div>
        </div>
        <div data-close-signed className="flex flex-col gap-3 self-start">
          <Chip tone="done" className="self-start">
            <Lock {...ICON_SM} />
            Signed off
          </Chip>
          <p className="text-[14px] leading-[20px] text-muted">{SIGNED}</p>
        </div>
      </div>
    </AppCard>
  );
}

/** oneth's month-end adjustment, as the app's journal table: account, debit, credit. */
function AdjustmentsCard() {
  const lines = [
    { ...depreciation.expense, dr: depreciation.charge, cr: 0 },
    { ...depreciation.accumulated, dr: 0, cr: depreciation.charge },
  ];
  return (
    <AppCard
      title="Proposed adjustments"
      action={
        <Chip size="sm" tone="accent">
          oneth proposed
        </Chip>
      }
    >
      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-semibold leading-[20px]">
          {depreciation.description}
        </p>
        <table className="w-full table-fixed text-[13px] tabular-nums">
          <colgroup>
            <col />
            <col className="w-[84px]" />
            <col className="w-[84px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-line-soft text-left text-[12px] text-muted">
              <th className="py-1.5 font-normal">Account</th>
              <th className="py-1.5 text-right font-normal">Debit</th>
              <th className="py-1.5 text-right font-normal">Credit</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr
                key={l.code}
                className="border-b border-line-soft last:border-0"
              >
                <td className="truncate py-2 pr-2">
                  <span className="font-semibold">{l.code}</span>{" "}
                  <span className="text-muted">{l.name}</span>
                </td>
                <td className="whitespace-nowrap py-2 text-right">
                  {l.dr ? `AED ${aed(l.dr)}` : ""}
                </td>
                <td className="whitespace-nowrap py-2 text-right">
                  {l.cr ? `AED ${aed(l.cr)}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppCard>
  );
}

/** The app's confirmation: shown only while the timeline plays (the finished state has no dialog). */
function ConfirmDialog() {
  return (
    <div
      data-close-dialog
      aria-hidden
      className="absolute inset-0 z-10 flex items-center justify-center rounded-[18px] bg-ink/25"
      style={{ opacity: 0, visibility: "hidden" }}
    >
      <div
        data-close-dialog-card
        className="flex w-[420px] flex-col gap-4 rounded-app-card bg-paper p-6 font-app text-ink shadow-float"
      >
        <div className="flex flex-col gap-1">
          <p className="text-[18px] font-semibold leading-[26px]">
            Sign off {closePeriod.month}?
          </p>
          <p className="text-[14px] leading-[20px] text-muted">
            {client.name}. This can&apos;t be undone.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <PillButton data-close-confirm className="w-full">
            Sign off
          </PillButton>
          <span className="inline-flex h-10 w-full items-center justify-center rounded-full text-[14px] font-semibold text-muted">
            Cancel
          </span>
        </div>
      </div>
    </div>
  );
}

function DesktopScene() {
  return (
    <Stage
      width={1200}
      height={600}
      label={`The oneth app's period close for ${client.name}, ${closePeriod.month}. Its close checklist: all documents processed, bank statement reconciled, all decisions reviewed, no missing evidence, VAT workings prepared. Each item turns Done. With nothing blocked, a partner signs off: the month is locked and its decisions can't change. Nothing is posted to the accounting system.`}
    >
      <div className="absolute inset-0 flex overflow-hidden rounded-[18px] border border-line bg-canvas font-app text-ink shadow-float antialiased">
        <AppRail active="close" badge={13} />
        <div className="flex min-w-0 flex-1 flex-col px-6 pb-6">
          <AppTopBar
            title="Period close"
            initials={firm.partnerInitials}
            compact
          />
          <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-[minmax(0,1fr)] gap-4">
            <AppCard
              data-close-checklist
              title={`${client.name} · ${closePeriod.month}`}
              open
              action={<PeriodStatus />}
              className="col-span-7 h-full"
            >
              <Checklist />
            </AppCard>
            <div className="col-span-5 flex min-h-0 flex-col gap-4">
              <SignOffCard />
              <AdjustmentsCard />
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog />
      <div
        data-close-cursor
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-20"
        style={{ opacity: 0 }}
      >
        <CursorPointer />
      </div>
    </Stage>
  );
}

/** Phones: the same three cards, stacked. The rows turn Done as the checklist scrolls through. */
function MobileScene() {
  return (
    <div
      data-mobile
      className="container-x mt-10 flex max-w-xl flex-col gap-3 font-app text-ink antialiased lg:hidden"
    >
      <AppCard data-close-checklist>
        <div className="flex flex-col gap-2">
          <p className="text-[15px] font-semibold leading-[22px]">
            {client.name} · {closePeriod.month}
          </p>
          <span className="self-start">
            <PeriodStatus align="start" />
          </span>
        </div>
        <Checklist compact />
      </AppCard>
      <SignOffCard />
      <AdjustmentsCard />
    </div>
  );
}

export default function PeriodCloseScene() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      const mm = closeAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="close"
      aria-labelledby="close-title"
      className="relative py-24 sm:py-28 lg:flex lg:h-svh lg:flex-col lg:pb-5 lg:pt-20"
    >
      <SectionHeading
        id="close-title"
        eyebrow="Period close"
        title="A partner signs off the month."
        className="container-x"
        pinned
      >
        The close checklist fills in as the work is reviewed. Once nothing is
        blocked, a partner signs off and the month is locked.
      </SectionHeading>
      <div
        data-desktop
        className="container-x mt-6 hidden min-h-0 flex-1 lg:block"
      >
        <DesktopScene />
      </div>
      <MobileScene />
    </section>
  );
}
