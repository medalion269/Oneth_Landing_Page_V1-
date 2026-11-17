"use client";

import { useRef } from "react";
import { ChevronUp, FileQuestion, FileUp, LogOut, MessageCircle, RefreshCw, ZapOff } from "lucide-react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import Stage from "./Stage";
import { AppCard, AppRail, AppTopBar, Chip, ICON, ListRow, PillButton } from "./app/ui";
import { portalAnimation, useGSAP } from "@/lib/animations";
import { aed, bazaarInvoice, client, firm, formatTrn, openRequest, portalQuestion } from "@/lib/demo-data";

/*
 * Client portal, "answer and snap". Left: the client's phone, on the portal the firm sends them to
 * (frontend/src/portal: the firm's name and colour, three big tabs, the Questions tab's question card). Right: the firm's
 * own view, the client's Communications tab (frontend/src/app/clients/RequestTabs.tsx). The client answers, attaches a
 * photo of the supplier's invoice and sends; the request turns Answered, and the conversation gains the reply and oneth's new
 * proposal (pipeline/client_requests.propose_settlement). Markup is the finished state.
 */

const q = portalQuestion;
/** The portal's width inside the desktop phone, in CSS pixels (a small phone), before it is scaled to the screen. */
const PHONE_WIDTH = 360;
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
                  <InvoiceThumb />
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

/** A thumbnail of the photo just taken (the invoice on the countertop), beside the attachment's name. */
export function InvoiceThumb() {
  return (
    <span aria-hidden className="cam-surface relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[4px]">
      <span className="invoice-paper flex h-[22px] w-[16px] -rotate-3 flex-col gap-[2px] px-[2px] pt-[3px] text-ink shadow-[0_2px_3px_rgb(0_0_0/0.35)]">
        <span className="flex justify-between">
          <span className="size-[3px] rounded-[1px] bg-[#b4532a]" />
          <span className="h-[2px] w-[5px] bg-current opacity-60" />
        </span>
        <span className="h-px w-2/3 bg-current opacity-35" />
        <span className="h-[3px] w-full bg-current opacity-15" />
        <span className="h-px w-full bg-current opacity-35" />
        <span className="ml-auto h-px w-1/2 bg-current opacity-60" />
      </span>
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

const INVOICE_COLS = "grid grid-cols-[minmax(0,1fr)_12px_30px_34px_26px_36px] gap-x-[4px]";

/**
 * The supplier's A4 tax invoice, as printed: letterhead with TRN, invoice details, bill-to with the client's TRN, the
 * lines (prices include VAT, so each shows its taxable amount and VAT), totals, how it was paid, and the footer.
 */
export function InvoicePage() {
  const v = bazaarInvoice;
  return (
    <div className="invoice-paper flex h-[330px] w-[234px] flex-col gap-[8px] px-[14px] pb-[12px] pt-[14px] font-sans text-[5.5px] leading-[7.5px] text-ink">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-[5px]">
          <span className="flex size-[17px] items-center justify-center rounded-[4px] bg-[#b4532a] text-[6.5px] font-bold text-white">BL</span>
          <span className="flex flex-col">
            <span className="text-[9px] font-semibold leading-[10px] tracking-[-0.01em]">{v.brand}</span>
            <span className="text-muted">{v.tagline}</span>
          </span>
        </div>
        <span className="flex flex-col items-end">
          <span className="text-[10px] font-bold leading-[12px] tracking-[0.05em]">TAX INVOICE</span>
          <span className="text-muted">{v.number}</span>
        </span>
      </div>
      <div className="flex justify-between gap-2 text-muted">
        <span className="flex flex-col">
          <span className="font-semibold text-ink">{v.supplier}</span>
          {v.address.map((l) => (
            <span key={l}>{l}</span>
          ))}
          <span>TRN {formatTrn(v.trn)}</span>
        </span>
        <span className="flex flex-col items-end">
          <span>Invoice date: {v.date}</span>
          <span>Supply date: {v.date}</span>
          <span>{v.order}</span>
        </span>
      </div>
      <div className="flex justify-between gap-2 rounded-[2px] bg-line-soft px-[6px] py-[5px] text-muted">
        <span className="flex flex-col">
          <span className="font-semibold text-ink">Bill to</span>
          <span>{client.name}</span>
          <span>TRN {formatTrn(client.trn)}</span>
        </span>
        <span className="flex flex-col items-end">
          <span className="font-semibold text-ink">Deliver to</span>
          <span>{v.deliverTo}</span>
          <span>Dubai Marina, Dubai</span>
        </span>
      </div>
      <div className="flex flex-col">
        <div className={`${INVOICE_COLS} border-b border-ink/70 pb-[3px] font-semibold`}>
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Unit price</span>
          <span className="text-right">Taxable</span>
          <span className="text-right">VAT 5%</span>
          <span className="text-right">Amount</span>
        </div>
        {v.lines.map((l) => (
          <div key={l.sku} className={`${INVOICE_COLS} border-b border-line py-[3px] tabular-nums`}>
            <span className="flex flex-col">
              <span>{l.item}</span>
              <span className="text-muted">SKU {l.sku}</span>
            </span>
            <span className="text-right">{l.qty}</span>
            <span className="text-right">{aed(l.unit)}</span>
            <span className="text-right">{aed(l.net)}</span>
            <span className="text-right">{aed(l.vat)}</span>
            <span className="text-right">{aed(l.gross)}</span>
          </div>
        ))}
        <span className="pt-[2px] text-muted">Unit prices include VAT at 5%.</span>
      </div>
      <div className="ml-auto flex w-[112px] flex-col gap-[1px] tabular-nums">
        <span className="flex justify-between">
          <span className="text-muted">Total taxable amount</span>
          <span>{aed(v.net)}</span>
        </span>
        <span className="flex justify-between">
          <span className="text-muted">Total VAT (5%)</span>
          <span>{aed(v.vat)}</span>
        </span>
        <span className="mt-[2px] flex justify-between border-t border-ink/70 pt-[3px] text-[7px] font-bold leading-[9px]">
          <span>Total AED</span>
          <span>{aed(v.gross)}</span>
        </span>
        <span className="flex justify-between text-muted">
          <span>Paid, card ending {v.card}</span>
          <span>{aed(v.gross)}</span>
        </span>
      </div>
      <div className="mt-auto flex flex-col gap-[1px] border-t border-line pt-[4px] text-center text-muted">
        <span>Thank you for your order.</span>
        <span>This is a computer-generated tax invoice and needs no signature.</span>
      </div>
    </div>
  );
}

/**
 * The phone's camera, shown only while the timeline plays: the invoice lying on a countertop in the viewfinder, a focus
 * box, then the shutter. The photo is drawn in CSS (paper with its folds, shadow, grain, vignette).
 */
function Camera() {
  return (
    <div data-pt-camera aria-hidden className="absolute inset-0 z-10 flex flex-col bg-[#050505] font-app" style={{ opacity: 0, visibility: "hidden" }}>
      <div className="flex h-12 shrink-0 items-end justify-between px-6 pb-2 text-white/85">
        <ZapOff size={16} strokeWidth={1.75} />
        <ChevronUp size={16} strokeWidth={1.75} />
        <span className="size-4" />
      </div>
      <div className="cam-surface relative min-h-0 flex-1 overflow-hidden">
        <svg className="absolute inset-0 h-full w-full opacity-[0.22] mix-blend-overlay" aria-hidden>
          <filter id="pt-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#pt-grain)" />
        </svg>
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: "translate(-50%, -50%) perspective(800px) rotateX(12deg) rotate(-3deg)",
            filter: "drop-shadow(0 14px 14px rgb(0 0 0 / 0.4)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.28))",
          }}
        >
          <InvoicePage />
        </div>
        <div className="cam-vignette absolute inset-0" />
        {/* Tap-to-focus box */}
        <span data-pt-focus className="absolute left-1/2 top-1/2 size-[92px] -translate-x-1/2 -translate-y-1/2 border border-[#ffd60a]" style={{ opacity: 0 }} />
      </div>
      <div className="flex shrink-0 flex-col items-center gap-3 pb-7 pt-3">
        <div className="flex gap-4 text-[10px] font-semibold tracking-[0.08em]">
          <span className="text-white/45">VIDEO</span>
          <span className="text-[#ffd60a]">PHOTO</span>
          <span className="text-white/45">PORTRAIT</span>
        </div>
        <div className="flex w-full items-center justify-between px-8">
          <span className="size-10 rounded-[8px] bg-white/15 ring-1 ring-white/25" />
          <span data-pt-shutter className="flex size-16 items-center justify-center rounded-full border-[3px] border-white">
            <span className="size-[52px] rounded-full bg-white" />
          </span>
          <span className="flex size-10 items-center justify-center rounded-full bg-white/15 text-white">
            <RefreshCw size={16} strokeWidth={1.75} />
          </span>
        </div>
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
      label={`Left, the client's phone: the client portal under ${firm.name}'s name. The accountant asked "${q.message}" about a card payment of AED ${aed(q.line.amount)} at Bazaar Lane Online on ${q.line.date}. The client types "${q.answer}", photographs the supplier's tax invoice and sends. Right, the firm's view in oneth, the client's Communications tab: the question turns Answered, the reply arrives with the photo, and oneth proposes settling the payment against the invoice, for a person to review.`}
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
        Your team&apos;s question reaches the client in a portal under your firm&apos;s name. They reply with a photo of the invoice, and{" "}
        <Brand className="font-medium text-ink" /> proposes how to settle the payment.
      </SectionHeading>
      <div data-desktop className="container-x mt-6 hidden min-h-0 flex-1 lg:block">
        <DesktopScene />
      </div>
      <MobileScene />
    </section>
  );
}
