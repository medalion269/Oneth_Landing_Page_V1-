"use client";

/**
 * Short confirmations in the app (ink pills, bottom left), and the card for the next Desert Line invoice that oneth
 * proposed by itself (bottom right), with Approve so a person can confirm it. Pills close themselves through a CSS
 * animation that changes nothing visible at its end, so they also close with reduced motion.
 */

import { Check, Sparkles, X } from "lucide-react";
import { Chip, ConfidenceBar, ICON_SM, PillButton } from "../app/ui";
import { aed, invoice, newPrecedent, nextInvoice } from "@/lib/demo-data";
import type { ToastKind, World } from "@/lib/hero-story";
import type { StoryActions } from "./useStory";

const TEXT: Record<ToastKind, string> = {
  "desert-approved": "Approved and recorded with its evidence. Saved as a precedent.",
  "inv441-approved": "Confirmed. The new Desert Line invoice is approved as oneth proposed it.",
  sent: "Sent to Omar Haddad in the client portal.",
  answered: "Omar Haddad replied with IMG_4417.jpg. oneth proposes settling the payment against it.",
  "bazaar-approved": "Approved. The 12 Nov card payment is explained.",
  "manara-AMC-3391": "Matched to AMC-3391. The 11 Nov payment is explained.",
  "manara-AMC-3402": "Matched to AMC-3402. AMC-3391 stays open.",
};

export function Toasts({ world, actions, guiding }: { world: World; actions: StoryActions; guiding: boolean }) {
  const showCard = world.inv441 === "proposed" && (guiding || !world.inv441Hidden);
  return (
    <>
      <div className="pointer-events-none absolute bottom-5 left-[88px] z-30 flex max-w-[420px] flex-col items-start gap-2">
        {world.toasts.map((t) => (
          <p
            key={t.id}
            role="status"
            className="toast-life flex items-center gap-2 rounded-full bg-ink py-2 pl-3 pr-4 text-[13px] font-semibold leading-[18px] text-white shadow-app"
            onAnimationEnd={() => actions.dismissToast(t.id)}
          >
            <Check {...ICON_SM} className="shrink-0" />
            {TEXT[t.kind]}
          </p>
        ))}
      </div>
      {showCard && (
        <section
          data-guide="inv441-card"
          aria-label="New decision proposed by oneth"
          className="card-in absolute bottom-5 right-5 z-30 flex w-[340px] flex-col gap-2.5 rounded-[20px] bg-paper p-5 text-ink shadow-float"
        >
          <header className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-accent-ink">
              <Sparkles {...ICON_SM} /> Just arrived · proposed by oneth
            </span>
            {!guiding && (
              <button type="button" aria-label="Later" onClick={actions.hideInv441} className="cursor-pointer rounded-full p-1 text-muted hover:text-ink">
                <X {...ICON_SM} />
              </button>
            )}
          </header>
          <p className="text-[14px] font-semibold leading-[20px]">
            Classify {invoice.supplierShort} invoice {nextInvoice.number}
          </p>
          <p className="text-[13px] leading-[18px] text-muted">AED {aed(nextInvoice.total)} · 6120 Office supplies · SR</p>
          <p className="rounded-app-tile bg-accent-soft px-3 py-2 text-[12px] leading-[16px] text-accent-ink">
            Precedents: 1 applied · {newPrecedent.pattern} (your approval)
          </p>
          <span className="flex items-center justify-between gap-2 text-[12px] text-muted">
            <ConfidenceBar value={nextInvoice.confidence} />
            <span>High, from your team&apos;s precedent</span>
          </span>
          <span className="flex items-center gap-2">
            <Chip size="sm" tone="accent">
              Proposed
            </Chip>
            <span className="text-[12px] leading-[16px] text-muted">Within your permissions. Proposed, not applied.</span>
          </span>
          <PillButton onClick={actions.approveInv441} className="w-full" data-guide="inv441-approve">
            <Check {...ICON_SM} /> Approve
          </PillButton>
        </section>
      )}
    </>
  );
}
