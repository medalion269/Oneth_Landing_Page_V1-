"use client";

import { useRef, useState, type ComponentType, type ReactNode } from "react";
import SectionHeading from "./SectionHeading";
import { IconBank, IconCalendarCheck, IconCheck, IconDoc, IconMessage, IconPercent, IconPin, IconSpark } from "./icons";
import { featuresAnimation, useGSAP } from "@/lib/animations";
import { aed, client, invoice } from "@/lib/demo-data";

/* Small illustrations. Each one responds to hovering its card (CSS only). */

function InvoiceArt() {
  return (
    <div className="relative mx-auto w-[78%] rounded-lg border border-line bg-paper p-3 shadow-soft">
      <div className="h-1.5 w-1/2 rounded bg-ink/80" />
      <div className="mt-1 h-1 w-1/3 rounded bg-line" />
      <div className="mt-3 flex items-center justify-between">
        <span className="relative text-[9px] font-medium">
          <span className="absolute -inset-x-1 -inset-y-0.5 rounded bg-accent/10 opacity-40 ring-1 ring-accent/50 transition-opacity duration-300 card-on:opacity-100" />
          <span className="relative tnum">{invoice.number}</span>
        </span>
        <span className="relative text-[9px] font-medium">
          <span className="absolute -inset-x-1 -inset-y-0.5 rounded bg-accent/10 opacity-40 ring-1 ring-accent/50 transition-opacity delay-75 duration-300 card-on:opacity-100" />
          <span className="relative tnum">{invoice.date}</span>
        </span>
      </div>
      <div className="mt-2.5 space-y-1">
        <div className="h-1 rounded bg-line" />
        <div className="h-1 w-5/6 rounded bg-line" />
      </div>
      <div className="mt-2.5 flex justify-end">
        <span className="relative text-[10px] font-semibold">
          <span className="absolute -inset-x-1 -inset-y-0.5 rounded bg-accent/10 opacity-40 ring-1 ring-accent/50 transition-opacity delay-150 duration-300 card-on:opacity-100" />
          <span className="relative tnum">AED {aed(invoice.total)}</span>
        </span>
      </div>
      <span className="pill pill-accent absolute -right-3 -top-3 translate-y-1 opacity-0 shadow-soft transition duration-300 card-on:translate-y-0 card-on:opacity-100">
        <IconSpark size={10} /> 5 fields read
      </span>
    </div>
  );
}

function CategoriseArt() {
  const rows = [
    { name: "TRF MARINA HEIGHTS FM", from: "Facilities 6310", to: "Facilities 6310" },
    { name: "CARD 4021 PAPERLINE STATIONERY", from: "Uncategorised", to: "Office supplies 6120" },
  ];
  return (
    <div className="mx-auto w-[86%] space-y-2">
      {rows.map((r, i) => (
        <div key={r.name} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-paper px-2.5 py-2 shadow-soft">
          <span className="truncate font-mono text-[9.5px]">{r.name}</span>
          <span className="stack">
            <span className={`pill text-[9.5px]! transition-opacity duration-300 ${i ? "pill-neutral card-on:opacity-0" : "pill-accent"}`}>{r.from}</span>
            <span className={`pill pill-accent text-[9.5px]! transition-opacity duration-300 ${i ? "opacity-0 card-on:opacity-100" : "opacity-0"}`}>{r.to}</span>
          </span>
        </div>
      ))}
      <p className="text-center text-[9.5px] text-muted">Based on how your team coded similar items</p>
    </div>
  );
}

function ReconcileArt() {
  return (
    <div className="mx-auto flex w-[88%] items-center justify-between">
      <div className="w-[40%] rounded-lg border border-line bg-paper p-2 shadow-soft">
        <p className="font-mono text-[8.5px] text-muted">05 NOV · BANK</p>
        <p className="tnum mt-0.5 text-[10px] font-semibold">-{aed(invoice.total)}</p>
      </div>
      <svg viewBox="0 0 60 20" className="h-5 w-[16%] overflow-visible" aria-hidden>
        <path
          d="M0 10 H60"
          pathLength={1}
          stroke="#033FFE"
          strokeWidth={1.5}
          strokeDasharray="1"
          className="[stroke-dashoffset:0.6] transition-[stroke-dashoffset] duration-500 card-on:[stroke-dashoffset:0]"
        />
        <circle cx="0" cy="10" r="2.5" fill="#033FFE" />
        <circle cx="60" cy="10" r="2.5" fill="#033FFE" className="opacity-30 transition-opacity delay-300 duration-200 card-on:opacity-100" />
      </svg>
      <div className="relative w-[40%] rounded-lg border border-line bg-paper p-2 shadow-soft">
        <p className="text-[8.5px] text-muted">{invoice.number}</p>
        <p className="tnum mt-0.5 text-[10px] font-semibold">{aed(invoice.total)}</p>
        <span className="absolute -right-2 -top-2 grid h-5 w-5 scale-75 place-items-center rounded-full bg-accent text-white opacity-0 transition duration-300 card-on:scale-100 card-on:opacity-100">
          <IconCheck size={11} strokeWidth={2.6} />
        </span>
      </div>
    </div>
  );
}

function VatArt() {
  const rows = [
    { label: "Standard rated 5%", value: "412,300.00", w: "88%" },
    { label: "Zero rated", value: "64,850.00", w: "34%" },
    { label: "Exempt", value: "18,200.00", w: "16%" },
  ];
  return (
    <div className="mx-auto w-[86%] space-y-2.5">
      {rows.map((r, i) => (
        <div key={r.label}>
          <div className="flex justify-between text-[9.5px]">
            <span className="text-muted">{r.label}</span>
            <span className="tnum font-medium">{r.value}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line-soft">
            <div
              className="h-full origin-left scale-x-[0.82] rounded-full bg-accent transition-transform duration-500 card-on:scale-x-100"
              style={{ width: r.w, opacity: 1 - i * 0.25, transitionDelay: `${i * 60}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RequestArt() {
  return (
    <div className="mx-auto w-[86%]">
      <div className="rounded-xl rounded-bl-sm border border-line bg-paper p-2.5 text-[9.5px] leading-snug shadow-soft">
        Hi {client.contact}, could you share the receipt for AED 1,149.00 paid to Bazaar Lane Online on 12 Nov?
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="pill pill-neutral text-[9px]!">Draft for your review</span>
        <span className="rounded-md bg-ink px-2 py-1 text-[9px] font-medium text-white opacity-60 transition-opacity duration-300 card-on:opacity-100">
          Review and send
        </span>
      </div>
    </div>
  );
}

function CloseArt() {
  const items = [
    { label: "Bank reconciled", done: true },
    { label: "Bills reviewed", done: true },
    { label: "VAT checked", done: true },
    { label: "1 client query open", done: false },
  ];
  return (
    <div className="mx-auto w-[82%]">
      <div className="space-y-1.5">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-2 text-[10px]">
            <span className={`grid h-3.5 w-3.5 place-items-center rounded-full ${it.done ? "bg-accent text-white" : "border border-line bg-paper"}`}>
              {it.done && <IconCheck size={9} strokeWidth={3} />}
            </span>
            <span className={it.done ? "" : "text-muted"}>{it.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line-soft">
        <div className="h-full w-full origin-left scale-x-[0.75] rounded-full bg-accent transition-transform duration-700 card-on:scale-x-[0.8]" />
      </div>
      <p className="mt-1 text-[9px] text-muted">{client.short} · November close</p>
    </div>
  );
}

const features: { title: string; body: string; icon: ComponentType<{ size?: number }>; art: ReactNode }[] = [
  {
    title: "Invoice and receipt processing",
    body: "Reads supplier invoices, receipts and client PDFs, and picks out dates, amounts, VAT and TRNs.",
    icon: IconDoc,
    art: <InvoiceArt />,
  },
  {
    title: "Transaction categorisation",
    body: "Suggests accounts from your chart of accounts, based on how your team coded similar items.",
    icon: IconSpark,
    art: <CategoriseArt />,
  },
  {
    title: "Bank reconciliation",
    body: "Matches bank lines to invoices and bills, and flags the ones that need a person.",
    icon: IconBank,
    art: <ReconcileArt />,
  },
  {
    title: "UAE VAT preparation",
    body: "Separates standard rated, zero rated and exempt amounts so your VAT return review starts organised.",
    icon: IconPercent,
    art: <VatArt />,
  },
  {
    title: "Missing document requests",
    body: "Finds transactions without support and drafts the request to your client for you to send.",
    icon: IconMessage,
    art: <RequestArt />,
  },
  {
    title: "Month-end close",
    body: "Shows what is done, what is waiting on the client and what needs review, client by client.",
    icon: IconCalendarCheck,
    art: <CloseArt />,
  },
];

const support = ["AED", "UAE VAT workflows", "Zoho Books", "Xero", "TallyPrime"];

export default function Features() {
  const root = useRef<HTMLElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  /** Phones: the card whose left edge is nearest the row's start is the one in view */
  const step = (el: HTMLElement) => {
    const [a, b] = [el.children[0] as HTMLElement, el.children[1] as HTMLElement];
    return b.offsetLeft - a.offsetLeft;
  };
  const onScroll = () => {
    const el = row.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    setActive(Math.min(features.length - 1, Math.max(0, Math.round(el.scrollLeft / step(el)))));
  };
  const show = (i: number) => {
    const el = row.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: i * step(el), behavior: reduce ? "auto" : "smooth" });
  };

  useGSAP(
    () => {
      if (!root.current) return;
      const mm = featuresAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="features" aria-labelledby="features-title" className="relative py-24 sm:py-32">
      <div className="container-x">
        <SectionHeading id="features-title" eyebrow="Built for UAE accounting" title="Built for the way you work.">
          The repetitive parts of bookkeeping, prepared for your team to check. Your accountants stay in charge of every decision.
        </SectionHeading>

        {/* Phones: a row of cards to swipe through, the next one peeking in, with dots below; the card in view lights
            its illustration (`card-on`). Tablets and desktop: the same cards as a grid. */}
        <div
          ref={row}
          onScroll={onScroll}
          role="group"
          aria-label="Features"
          tabIndex={0}
          className="relative -mx-5 mt-10 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 outline-none [scrollbar-width:none] focus-visible:ring-4 focus-visible:ring-accent/15 sm:mx-0 sm:mt-14 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:p-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden"
        >
          {features.map((f, i) => (
            <article
              key={f.title}
              data-feature
              data-active={i === active}
              aria-label={`${i + 1} of ${features.length}: ${f.title}`}
              className="group card relative flex w-[84%] shrink-0 snap-start flex-col overflow-hidden p-5 transition-[translate,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[#dcdad5] hover:shadow-lift sm:w-auto"
            >
              <div aria-hidden className="grid h-44 place-items-center rounded-xl border border-line-soft bg-canvas">
                {f.art}
              </div>
              <div className="mt-5 flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-accent-ink">
                  <f.icon size={16} />
                </span>
                <h3 className="text-[16px] font-semibold tracking-[-0.015em]">{f.title}</h3>
              </div>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">{f.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-3 flex justify-center sm:hidden">
          {features.map((f, i) => (
            <button
              key={f.title}
              type="button"
              onClick={() => show(i)}
              aria-label={`Show ${f.title}`}
              aria-current={i === active}
              className="grid h-6 place-items-center px-1"
            >
              <span className={`block h-1.5 rounded-full transition-all duration-300 ${i === active ? "w-5 bg-ink" : "w-1.5 bg-line"}`} />
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div data-reveal className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
            <div className="sm:max-w-[16rem]">
              <p className="text-[16px] font-semibold tracking-[-0.015em]">Fits how UAE firms already work</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">Designed around AED books, UAE VAT and the accounting software your clients use.</p>
            </div>
            <ul className="flex flex-wrap gap-2 sm:ml-auto sm:justify-end" aria-label="Supported">
              {support.map((s) => (
                <li key={s} className="rounded-full border border-line bg-canvas px-3.5 py-1.5 text-[13.5px] font-medium">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal data-reveal-delay="0.08" className="card flex items-start gap-4 p-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink text-white">
              <IconPin size={18} />
            </span>
            <div>
              <p className="text-[16px] font-semibold tracking-[-0.015em]">Data stays in the UAE</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted">Our commitment: your clients&apos; financial data is stored in the UAE.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
