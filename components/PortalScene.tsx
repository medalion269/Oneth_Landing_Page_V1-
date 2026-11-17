"use client";

import { useRef } from "react";
import { FileQuestion, FileUp, LogOut, MessageCircle } from "lucide-react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import Stage from "./Stage";
import { AppCard, AppRail, AppTopBar, Chip, ICON, ListRow, PillButton } from "./app/ui";
import { portalAnimation, useGSAP } from "@/lib/animations";
import { aed, client, firm, formatTrn, openRequest, portalQuestion, splitGross } from "@/lib/demo-data";

/*
 * Client portal, "answer and snap". Left: the client's phone, on the portal the firm sends them to
 * (frontend/src/portal: the firm's name and colour, three big tabs, the Questions tab's question card). Right: the firm's
 * own view, the client's Communications tab (frontend/src/app/clients/RequestTabs.tsx). The client answers, attaches a
 * photo of the receipt and sends; the request turns Answered, and the conversation gains the reply and oneth's new
 * proposal (pipeline/client_requests.propose_settlement). Markup is the finished state.
 */

const q = portalQuestion;
/** The portal's width inside the desktop phone, in CSS pixels (a small phone), before it is scaled to the screen. */
const PHONE_WIDTH = 360;
const receiptAmounts = splitGross(q.line.amount);
const replySummary = `${client.contactName} replied: “${q.answer}” and attached ${q.photo}`;
const askSummary = `${firm.reviewer} asked the client: “${q.message}”`;
const onethSummary = `oneth: the client sent ${q.photo}; it proposes settling the AED ${aed(q.line.amount)} line against it`;

/* ------------------------------------------------------------------ */
/* The portal (the client's side)                                      */
/* ------------------------------------------------------------------ */

/** The question card: the firm's question, the bank line, and the answer form (gone once answered, as in the app). */
function QuestionCard() {
  return (
    <div data-pt-question className="flex flex-col gap-3 rounded-app-tile bg-line-soft p-4">
      <p className="text-[14px] font-semibold leading-[20px]">{q.message}</p>
      <div className="flex items-center justify-between gap-3 rounded-app-tile bg-paper px-4 py-3">
        <div className="flex min-w-0 flex-col">
          <span className="break-words text-[14px] leading-[20px]">{q.line.description}</span>
          <span className="text-[13px] leading-[18px] text-muted">{q.line.date}</span>
        </div>
        <span className="shrink-0 text-[14px] font-semibold tabular-nums">AED {aed(q.line.amount)}</span>
      </div>
      <div className="stack w-full grid-cols-[minmax(0,1fr)]">
        {/* The answer form: collapsed in the finished state (the app replaces it with the Answered chip) */}
        <div data-pt-form aria-hidden className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
          <div data-pt-form-inner className="flex flex-col gap-3 pb-1">
            <div className="flex flex-col gap-2">
              <span className="text-[13px] text-muted">Your answer</span>
              <span data-pt-textarea className="block min-h-[88px] rounded-app-tile bg-paper px-4 py-3 text-[14px] leading-[20px]">
                {q.answer.split(" ").map((word, i) => (
                  <span key={i} data-pt-word>
                    {word}{" "}
                  </span>
                ))}
              </span>
            </div>
            <span className="stack w-full grid-cols-[minmax(0,1fr)]">
              <PillButton data-pt-attach variant="secondary" className="h-12 w-full">
                <FileUp {...ICON} />
                Add a photo or file (optional)
              </PillButton>
              <span data-pt-attached className="flex items-center justify-between gap-2 rounded-app-tile bg-paper px-4 py-3 text-[13px]">
                <span className="flex min-w-0 items-center gap-2 truncate">
                  <ReceiptThumb />
                  Attached: {q.photo}
                </span>
                <span className="font-semibold text-muted">Remove</span>
              </span>
            </span>
            <span className="stack w-full grid-cols-[minmax(0,1fr)]">
              <PillButton data-pt-send-off className="h-12 w-full" style={{ opacity: 0 }}>
                Send answer
              </PillButton>
              <PillButton data-pt-send className="h-12 w-full">
                Send answer
              </PillButton>
              {/* Phones only: the thank-you takes the button's place, so the page keeps its height while it plays */}
              <span data-pt-answered-inline aria-hidden className="flex h-12 items-center justify-center" style={{ opacity: 0 }}>
                <Chip tone="done">Answered. Thank you!</Chip>
              </span>
            </span>
          </div>
        </div>
        <span data-pt-answered className="self-start">
          <Chip tone="done">Answered. Thank you!</Chip>
        </span>
      </div>
    </div>
  );
}

/** A tiny picture of the photographed receipt, beside the attachment's name. */
function ReceiptThumb() {
  return (
    <span aria-hidden className="flex h-7 w-5 shrink-0 flex-col gap-[2px] rounded-[3px] bg-line-soft px-[3px] py-[4px]">
      <span className="h-[2px] w-full rounded-full bg-faint" />
      <span className="h-[2px] w-2/3 rounded-full bg-faint" />
      <span className="h-[2px] w-full rounded-full bg-faint" />
      <span className="mt-auto h-[2px] w-1/2 self-end rounded-full bg-ink" />
    </span>
  );
}

/** The signed-in portal: the firm's mark and name, the client, three big tabs, then the Questions page. */
function Portal({ phone = false }: { phone?: boolean }) {
  return (
    <div className={`flex flex-col gap-4 font-app text-ink antialiased ${phone ? "p-4" : ""}`}>
      <header className="flex items-center justify-between gap-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-firm text-[13px] font-semibold text-white">
            {firm.initials}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-semibold leading-[22px]">{firm.name}</span>
            <span className="truncate text-[13px] leading-[18px] text-muted">{client.name}</span>
          </div>
        </div>
        <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-paper text-ink shadow-app">
          <LogOut {...ICON} />
        </span>
      </header>
      <nav aria-hidden className="grid grid-cols-3 gap-1 rounded-full bg-paper p-1 shadow-app">
        {["Home", "Questions", "Upload"].map((tab) => (
          <span
            key={tab}
            className={`flex h-12 items-center justify-center rounded-full text-[13px] font-semibold ${tab === "Questions" ? "bg-ink text-white" : "text-muted"}`}
          >
            {tab}
          </span>
        ))}
      </nav>
      <AppCard title="Questions from your accountant" data-pt-card>
        <QuestionCard />
      </AppCard>
    </div>
  );
}

/** The phone's camera, shown only while the timeline plays: the receipt in the viewfinder, then the shutter. */
function Camera() {
  return (
    <div data-pt-camera aria-hidden className="absolute inset-0 z-10 flex flex-col bg-ink" style={{ opacity: 0, visibility: "hidden" }}>
      <div className="flex flex-1 items-center justify-center">
        <div className="flex w-[150px] -rotate-3 flex-col gap-1.5 rounded-[6px] bg-paper px-3 py-4 font-mono text-[9px] leading-[12px] text-ink shadow-lift">
          <span className="text-center font-semibold">BAZAAR LANE ONLINE</span>
          <span className="text-center text-muted">Tax invoice · 12/11/2026</span>
          <span className="my-1 border-t border-dashed border-line" />
          <span className="flex justify-between">
            <span>6 × Folding chair</span>
            <span>{aed(receiptAmounts.gross)}</span>
          </span>
          <span className="flex justify-between text-muted">
            <span>incl. VAT 5%</span>
            <span>{aed(receiptAmounts.vat)}</span>
          </span>
          <span className="my-1 border-t border-dashed border-line" />
          <span className="flex justify-between font-semibold">
            <span>TOTAL AED</span>
            <span>{aed(receiptAmounts.gross)}</span>
          </span>
        </div>
      </div>
      <div className="flex items-center justify-center pb-8 pt-4">
        <span data-pt-shutter className="size-14 rounded-full border-4 border-white/70 bg-white" />
      </div>
      <span data-pt-flash className="absolute inset-0 bg-white" style={{ opacity: 0 }} />
    </div>
  );
}

/** The client's phone (desktop only): a 320×600 handset holding the portal at a phone's width. */
function Phone() {
  const scale = 300 / PHONE_WIDTH;
  return (
    <div data-pt-phone className="absolute left-[32px] top-0 h-[600px] w-[320px] rounded-[46px] bg-ink p-[10px] shadow-float">
      <div data-pt-screen className="relative h-full w-full overflow-hidden rounded-[36px] bg-canvas">
        <div className="relative z-10 flex h-8 items-center justify-between bg-canvas px-6 font-app text-[12px] font-semibold text-ink">
          <span>{q.answeredAt.split(", ")[1]}</span>
          <span className="h-[18px] w-[72px] rounded-full bg-ink" />
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-4 rounded-[3px] border border-ink" />
          </span>
        </div>
        <div data-pt-scale={scale} className="relative" style={{ width: PHONE_WIDTH, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          {/* Scrolled by the timeline while the answer form is open, as a phone scrolls to the field being typed in */}
          <div data-pt-scroll>
            <Portal phone />
          </div>
        </div>
        <Camera />
        <span data-pt-tap aria-hidden className="absolute left-0 top-0 z-20 size-10 rounded-full bg-ink/20 ring-2 ring-ink/30" style={{ opacity: 0 }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The firm's side: the client's Communications tab                     */
/* ------------------------------------------------------------------ */

const WORKSPACE_TABS = ["Overview", "Documents", "Transactions", "Bank reconciliation", "VAT", "Periods", "Decisions", "Missing documents", "Communications", "Audit trail"];

/**
 * Requests and questions, with their status (the app's requestStatus: Waiting, Answered). Like the app, a request's icon
 * is a file once a document came with it, a speech bubble otherwise: the question's turns into a file with the photo.
 */
function RequestsCard() {
  return (
    <AppCard title="Requests and questions" className="h-full overflow-hidden">
      <div className="flex flex-col gap-2">
        <ListRow
          stacked
          wrap
          iconNode={
            <span className="stack">
              <span data-pt-req-before aria-hidden style={{ opacity: 0 }}>
                <MessageCircle {...ICON} />
              </span>
              <span data-pt-req-after>
                <FileQuestion {...ICON} />
              </span>
            </span>
          }
          title={q.title}
          subtitle="Asked 1 day ago"
          right={
            <span className="stack">
              <span data-pt-req-before aria-hidden style={{ opacity: 0 }}>
                <Chip size="sm" tone="review">
                  Waiting
                </Chip>
              </span>
              <span data-pt-req-after>
                <Chip size="sm" tone="done">
                  Answered
                </Chip>
              </span>
            </span>
          }
        />
        <ListRow
          stacked
          icon={MessageCircle}
          title={openRequest.title}
          subtitle={`Asked ${openRequest.asked}`}
          right={
            <Chip size="sm" tone="review">
              Waiting
            </Chip>
          }
        />
      </div>
    </AppCard>
  );
}

function Message({ who, at, summary, oneth = false, ...rest }: { who: string; at: string; summary: string; oneth?: boolean } & Record<`data-${string}`, unknown>) {
  return (
    <li {...rest} className="relative flex flex-col gap-1 border-b border-line-soft py-3 last:border-b-0">
      {oneth && <span data-pt-glow aria-hidden className="absolute -inset-x-2 inset-y-1 rounded-app-tile bg-accent-soft" style={{ opacity: 0 }} />}
      <span className="relative flex items-center gap-2">
        <Chip size="sm" tone={oneth ? "accent" : "neutral"}>
          {who}
        </Chip>
        <span className="text-[12px] text-faint tabular-nums">{at}</span>
      </span>
      <span className="relative text-[14px] leading-[20px]">{summary}</span>
      <span className="relative text-[13px] font-semibold text-muted">Open the decision</span>
    </li>
  );
}

/** The conversation from the audit trail, newest first: anything the client did, the asks and oneth's re-proposals. */
function ConversationCard({ className = "" }: { className?: string }) {
  return (
    <AppCard title="Conversation" className={className} data-pt-conversation>
      <ol className="flex flex-col">
        <Message data-pt-msg="oneth" who="oneth" at={q.reproposedAt} summary={onethSummary} oneth />
        <Message data-pt-msg="client" who={client.contactName} at={q.answeredAt} summary={replySummary} />
        <Message data-pt-msg="ask" who={firm.reviewer} at={q.askedAt} summary={askSummary} />
      </ol>
    </AppCard>
  );
}

function FirmApp() {
  return (
    <div
      data-pt-app
      className="absolute bottom-0 left-[392px] right-0 top-0 flex overflow-hidden rounded-[18px] border border-line bg-canvas font-app text-ink shadow-float antialiased"
    >
      <AppRail active="clients" badge={13} />
      <div className="flex min-w-0 flex-1 flex-col gap-3 px-6 pb-6">
        <AppTopBar title="Clients" compact />
        <section className="flex flex-col gap-1 rounded-app-card bg-paper px-6 py-4 shadow-app">
          <p className="text-[18px] font-semibold leading-[26px]">{client.name}</p>
          <p className="text-[13px] text-muted tabular-nums">TRN {formatTrn(client.trn)} · Restaurants · Monthly VAT</p>
        </section>
        <div className="flex justify-end overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_48px)]">
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-paper p-1 shadow-app">
            {WORKSPACE_TABS.map((t) => (
              <span
                key={t}
                className={`inline-flex h-8 items-center whitespace-nowrap rounded-full px-4 text-[13px] font-semibold ${t === "Communications" ? "bg-ink text-white" : "text-muted"}`}
              >
                {t}
              </span>
            ))}
          </span>
        </div>
        <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-[minmax(0,1fr)] gap-4">
          <div className="col-span-5 min-h-0">
            <RequestsCard />
          </div>
          <ConversationCard className="col-span-7 h-full overflow-hidden" />
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
      label={`Left, the client's phone: the client portal under ${firm.name}'s name. The accountant asked "${q.message}" about a card payment of AED ${aed(q.line.amount)} at Bazaar Lane Online on ${q.line.date}. The client types "${q.answer}", photographs the receipt and sends. Right, the firm's view in oneth, the client's Communications tab: the question turns Answered, the reply arrives with the photo, and oneth proposes settling the payment against the receipt, for a person to review.`}
    >
      <Phone />
      <FirmApp />
    </Stage>
  );
}

/** Phones: the portal fills the screen (the visitor is holding a phone already), then what the firm sees. */
function MobileScene() {
  return (
    <div data-mobile className="container-x mt-10 flex max-w-xl flex-col gap-3 lg:hidden">
      <div className="rounded-app-card bg-canvas">
        <Portal />
      </div>
      <p className="mt-4 px-1 font-app text-[13px] font-semibold text-muted">
        What your team sees in <Brand className="font-semibold text-ink" />
      </p>
      <div className="font-app text-ink antialiased">
        <ConversationCard />
      </div>
    </div>
  );
}

export default function PortalScene() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      const mm = portalAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="portal" aria-labelledby="portal-title" className="relative py-24 sm:py-28 lg:flex lg:h-svh lg:flex-col lg:pb-5 lg:pt-20">
      <SectionHeading id="portal-title" eyebrow="Client portal" title="Your client answers from their phone." className="container-x" pinned>
        Your team&apos;s question reaches the client in a portal under your firm&apos;s name. They reply with a photo of the receipt, and{" "}
        <Brand className="font-medium text-ink" /> proposes how to settle the payment.
      </SectionHeading>
      <div data-desktop className="container-x mt-6 hidden min-h-0 flex-1 lg:block">
        <DesktopScene />
      </div>
      <MobileScene />
    </section>
  );
}
