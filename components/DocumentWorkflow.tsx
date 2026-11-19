"use client";

import { useRef } from "react";
import { Check, FileText } from "lucide-react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import Stage from "./Stage";
import { ClientPdfDoc, InvoiceDoc, ReceiptDoc, StatementDoc, type InvoiceField } from "./Documents";
import { IconSpark } from "./icons";
import { Chip, ConfidenceBar, ICON_SM } from "./app/ui";
import { documentWorkflowAnimation, useGSAP } from "@/lib/animations";
import { aed, formatTrn, invoice, preparedEntry } from "@/lib/demo-data";

/** The app runs in shadow mode: it proposes, people approve, nothing is written back. */
const NOT_WRITTEN = "oneth only proposes. Nothing is written to your books.";

/** Invoice field -> entry row. Order is the order the connectors draw. */
const CONNECTORS: { from: InvoiceField; to: string }[] = [
  { from: "supplier", to: "supplier" },
  { from: "trn", to: "trn" },
  { from: "number", to: "number" },
  { from: "date", to: "date" },
  { from: "subtotal", to: "l6120" },
  { from: "vat", to: "l1450" },
  { from: "total", to: "l2010" },
];

const HIGHLIGHTS: InvoiceField[] = ["supplier", "trn", "number", "date", "subtotal", "vat", "total"];

const entryFields = [
  { key: "supplier", label: "Supplier", value: invoice.supplier },
  { key: "trn", label: "Supplier TRN", value: formatTrn(invoice.supplierTrn) },
  { key: "number", label: "Invoice no.", value: invoice.number },
  { key: "date", label: "Invoice date", value: `${invoice.date} · due ${invoice.due}` },
];

function Skeleton({ w = "66%" }: { w?: string }) {
  return <span data-skeleton aria-hidden className="absolute inset-y-[3px] left-0 rounded bg-line-soft" style={{ width: w, opacity: 0 }} />;
}

function Spinner() {
  return <span aria-hidden className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />;
}

/**
 * What oneth makes of the invoice, as the app shows it: the Document card with the fields it read (checked by the
 * engine, then "Validated"), and the classification decision it proposes, waiting for review.
 */
function EntryPanel() {
  const cols = "grid-cols-[1fr_88px_88px]";
  return (
    <div className="relative flex flex-col gap-4 font-app text-[13px] leading-[18px] text-ink antialiased">
      <section className="flex flex-col gap-3 rounded-app-card bg-paper p-6 shadow-app">
        <header className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-semibold leading-[22px]">Document</p>
          <span className="flex items-center gap-2">
            <Chip size="sm" tone="neutral">
              <FileText {...ICON_SM} /> {invoice.file}
            </Chip>
            <span className="stack shrink-0">
              <span data-status-processing className="justify-self-end" style={{ opacity: 0 }}>
                <Chip size="sm" tone="neutral">
                  <Spinner /> Reading
                </Chip>
              </span>
              <span data-status-ready className="justify-self-end">
                <Chip size="sm" tone="done">
                  Validated
                </Chip>
              </span>
            </span>
          </span>
        </header>
        <div className="flex flex-col">
          {entryFields.map((f) => (
            <div key={f.key} data-target={f.key} className="grid grid-cols-[112px_1fr] items-center gap-3 border-b border-line-soft py-1.5 last:border-0">
              <span className="text-muted">{f.label}</span>
              <span className="relative min-w-0 text-right">
                <Skeleton />
                <span data-value className="block truncate tabular-nums">
                  {f.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-app-card bg-paper p-6 shadow-app">
        <header className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-semibold leading-[22px]">Decision record</p>
          <span data-entry-extra className="flex items-center gap-2">
            <Chip size="sm" tone="neutral">
              Classification
            </Chip>
            <Chip size="sm" tone="review">
              Needs review
            </Chip>
          </span>
        </header>
        <div>
          <div className={`grid ${cols} gap-3 pb-1 text-[12px] text-muted`}>
            <span>Proposal</span>
            <span className="text-right">Debit</span>
            <span className="text-right">Credit</span>
          </div>
          {preparedEntry.lines.map((l) => (
            <div key={l.code} data-target={`l${l.code}`} className={`grid ${cols} items-center gap-3 border-t border-line-soft py-1.5`}>
              <span className="relative min-w-0">
                <Skeleton w="80%" />
                <span data-value className="block truncate">
                  <span className="mr-1.5 text-muted tabular-nums">{l.code}</span>
                  {l.account}
                </span>
              </span>
              <span className="relative text-right tabular-nums">
                {l.debit ? (
                  <>
                    <Skeleton w="100%" />
                    <span data-value>{aed(l.debit)}</span>
                  </>
                ) : null}
              </span>
              <span className="relative text-right tabular-nums">
                {l.credit ? (
                  <>
                    <Skeleton w="100%" />
                    <span data-value>{aed(l.credit)}</span>
                  </>
                ) : null}
              </span>
            </div>
          ))}
        </div>
        <div data-entry-extra className="flex items-center gap-3 border-t border-line-soft pt-3">
          <ConfidenceBar value={0.94} />
          <span className="text-muted">High confidence</span>
          <span className="ml-auto inline-flex items-center gap-1 font-semibold text-ok">
            <Check {...ICON_SM} /> Debits equal credits
          </span>
        </div>
        <p data-entry-extra className="text-[12px] text-muted">
          Prepared by <Brand /> from {invoice.file}. {NOT_WRITTEN}
        </p>
      </section>
      <div data-panel-glow aria-hidden className="pointer-events-none absolute -inset-1 rounded-[28px] ring-2 ring-accent/35" />
    </div>
  );
}

function DesktopScene() {
  return (
    <Stage
      width={1200}
      height={600}
      label={`A supplier invoice from ${invoice.supplier} is read. Its supplier, TRN, invoice number and date fill the app's Document card, which is validated, and its subtotal, VAT and total become oneth's proposed journal, which waits for review.`}
    >
      {/* Source documents. Final positions form a stack behind the invoice. */}
      <div data-doc="statement" data-rot="-6" className="absolute" style={{ left: 30, top: 300, transform: "rotate(-6deg)" }}>
        <StatementDoc />
      </div>
      <div data-doc="receipt" data-rot="4" className="absolute" style={{ left: 8, top: 112, transform: "rotate(4deg)" }}>
        <ReceiptDoc />
      </div>
      <div data-doc="pdf" data-rot="-8" className="absolute" style={{ left: 60, top: 78, transform: "rotate(-8deg)" }}>
        <ClientPdfDoc />
      </div>
      <div data-doc="invoice" className="absolute w-[380px]" style={{ left: 150, top: 50 }}>
        <div data-select-ring aria-hidden className="absolute -inset-2 rounded-[16px] border-[1.5px] border-accent/45" />
        <span data-select-chip className="pill pill-accent absolute -top-10 left-0 text-[12px]!">
          <IconSpark size={13} /> Reading supplier invoice
        </span>
        <InvoiceDoc highlights={HIGHLIGHTS} />
      </div>

      {/* Connectors: drawn in design pixels, positioned by lib/animations.ts */}
      <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width={1200} height={600} viewBox="0 0 1200 600">
        {CONNECTORS.map((c) => (
          <path
            key={c.from}
            data-connector
            data-from={c.from}
            data-to={c.to}
            pathLength={1}
            fill="none"
            stroke="#033FFE"
            strokeOpacity={0.55}
            strokeWidth={1.25}
            strokeDasharray="1"
            strokeDashoffset={0}
          />
        ))}
        {CONNECTORS.map((c) => (
          <g key={`m-${c.from}`}>
            <circle data-port={c.from} r={3} fill="#fff" stroke="#033FFE" strokeWidth={1.5} />
            <circle data-end={c.from} r={2.5} fill="#033FFE" />
            <circle data-dot={c.from} r={4} cx={0} cy={0} fill="#033FFE" style={{ opacity: 0 }} />
          </g>
        ))}
      </svg>

      <div data-panel className="absolute w-[560px]" style={{ left: 640, top: 24 }}>
        <EntryPanel />
      </div>
    </Stage>
  );
}

/** Invoice field -> ledger slot, in the order the scan line reaches them. */
const SCAN_FIELDS = [
  { key: "supplier", value: invoice.supplierShort },
  { key: "number", value: invoice.number },
  { key: "subtotal", value: aed(invoice.net) },
  { key: "vat", value: aed(invoice.vat) },
  { key: "total", value: aed(invoice.total) },
] as const;

const SCAN_CANVAS = { width: 340, height: 452 };

function ScanValue({ field, children }: { field: string; children: React.ReactNode }) {
  return (
    <span className="hl" data-scan-field={field}>
      <span className="hl-box" data-hl={field} />
      {children}
    </span>
  );
}

function Slot({ field, children, className = "" }: { field: string; children: React.ReactNode; className?: string }) {
  return (
    <span data-slot={field} className={`relative inline-block ${className}`}>
      <span data-slot-skel aria-hidden className="absolute inset-y-[3px] left-0 right-0 rounded bg-line-soft" style={{ opacity: 0 }} />
      <span data-slot-value className="relative">
        {children}
      </span>
    </span>
  );
}

/**
 * Phones: "Scan to ledger". The section holds while a blue scan line sweeps
 * down the invoice. Each key field it passes lifts off as a chip and drops into
 * its slot in the ledger below, which balances and is stamped Ready for review.
 * Markup is the finished frame; lib/animations.ts plays the scan.
 */
function MobileScene() {
  const { width: W, height: H } = SCAN_CANVAS;
  return (
    <div data-mobile className="container-x mt-10 flex max-w-xl flex-col lg:hidden motion-mobile:mt-4 motion-mobile:min-h-0 motion-mobile:flex-1">
      <div className="relative mx-auto aspect-[340/452] w-full max-w-[420px] motion-mobile:aspect-auto motion-mobile:min-h-0 motion-mobile:flex-1">
        <Stage
          width={W}
          height={H}
          maxScale={1.15}
          label={`A scan line reads the tax invoice from ${invoice.supplier}. The supplier, invoice number, subtotal, VAT and total move into oneth's proposed entry, which balances at AED ${aed(invoice.total)} and waits for review.`}
        >
          {/* The source invoice: the same printed tax invoice as the desktop scene (InvoiceDoc, L22), cut to what fits
              above the ledger. Paper, not UI, so it keeps the invoice's own inks. */}
          <div
            data-scan-doc
            className="absolute overflow-hidden rounded-[3px] bg-white px-3.5 pb-2.5 pt-2.5 font-sans text-[10px] leading-[1.4] text-[#1d1d20] shadow-[0_0_0_1px_rgb(24_24_27/0.06),0_1px_2px_rgb(0_0_0/0.08),0_14px_30px_-12px_rgb(0_0_0/0.28)]"
            style={{ left: 10, top: 6, width: 320 }}
          >
            <div className="flex items-start gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-[4px] bg-[#1f3a37] text-[9px] font-semibold tracking-wide text-[#e9dcc2]">DL</span>
              <div className="min-w-0">
                <p className="text-[12px] font-bold leading-tight tracking-[-0.01em]">
                  <ScanValue field="supplier">{invoice.supplier}</ScanValue>
                </p>
                <p className="tnum mt-0.5 font-semibold">TRN {formatTrn(invoice.supplierTrn)}</p>
              </div>
            </div>
            <div className="mt-1.5 h-[2px] rounded-full bg-[#1f3a37]" />
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <p className="text-[11.5px] font-bold tracking-[0.06em]">TAX INVOICE</p>
              <p dir="rtl" lang="ar" className="text-[10.5px] text-[#6b6b72]">
                فاتورة ضريبية
              </p>
            </div>
            <p className="tnum mt-0.5 text-[#6b6b72]">
              Invoice no.{" "}
              <span className="mx-1 font-semibold text-[#1d1d20]">
                <ScanValue field="number">{invoice.number}</ScanValue>
              </span>{" "}
              · Date <span className="font-semibold text-[#1d1d20]">{invoice.date}</span>
            </p>
            <div className="mt-2">
              <div className="grid grid-cols-[minmax(0,1fr)_22px_52px] gap-x-2 rounded-[2px] bg-[#1f3a37] px-1.5 py-[3px] text-[8.5px] font-semibold text-white">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Taxable</span>
              </div>
              {invoice.lines.map((l) => (
                <div key={l.description} className="tnum grid grid-cols-[minmax(0,1fr)_22px_52px] gap-x-2 border-b border-[#ecebe7] px-1.5 py-[2px] text-[9.5px]">
                  <span>{l.description}</span>
                  <span className="text-right">{l.qty}</span>
                  <span className="text-right">{aed(l.amount)}</span>
                </div>
              ))}
            </div>
            <div className="tnum ml-auto mt-1.5 w-[60%] space-y-1">
              <div className="flex justify-between gap-2">
                <span className="text-[#6b6b72]">Total taxable amount</span>
                <ScanValue field="subtotal">{aed(invoice.net)}</ScanValue>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#6b6b72]">VAT at 5%</span>
                <ScanValue field="vat">{aed(invoice.vat)}</ScanValue>
              </div>
              <div className="flex justify-between gap-2 border-t-2 border-[#1f3a37] pt-0.5 text-[11.5px] font-bold">
                <span>Total AED</span>
                <ScanValue field="total">{aed(invoice.total)}</ScanValue>
              </div>
            </div>
            {/* Scan line with a soft glow trailing above it */}
            <div data-scan-line aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0" style={{ opacity: 0 }}>
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-transparent to-accent/15" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-accent shadow-[0_0_12px_rgb(3_63_254/0.6)]" />
            </div>
          </div>

          {/* The ledger the fields land in */}
          <div data-ledger className="absolute rounded-app-card bg-paper p-4 font-app text-[12px] leading-snug shadow-float" style={{ left: 10, top: 248, width: 320 }}>
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-semibold">Decision record</p>
              <p className="tnum text-[11px] text-muted">
                <span data-scan-count>5</span> of 5 fields read
              </p>
            </div>
            <div className="mt-2 divide-y divide-line-soft rounded-app-tile bg-line-soft/60">
              <div className="flex items-center justify-between gap-2 px-3 py-[7px]">
                <Slot field="supplier" className="min-w-0 truncate font-medium">
                  {invoice.supplierShort}
                </Slot>
                <Slot field="number" className="tnum shrink-0 text-muted">
                  {invoice.number}
                </Slot>
              </div>
              {preparedEntry.lines.map((l, n) => {
                const slot = ["subtotal", "vat", "total"][n];
                return (
                  <div key={l.code} className="flex items-center justify-between gap-2 px-3 py-[7px]">
                    <span className="min-w-0 truncate">
                      <span className="tnum mr-1.5 text-muted">{l.code}</span>
                      {l.account}
                    </span>
                    <span className="tnum shrink-0">
                      <span className="mr-1 text-faint">{l.debit ? "Dr" : "Cr"}</span>
                      <Slot field={slot}>{aed(l.debit || l.credit)}</Slot>
                    </span>
                  </div>
                );
              })}
            </div>
            <div data-ledger-foot className="mt-2.5 flex items-center justify-between gap-2">
              <span data-stamp className="inline-flex">
                <Chip size="sm" tone="review">
                  Needs review
                </Chip>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ok">
                <Check size={12} strokeWidth={2} /> Debits equal credits
              </span>
            </div>
          </div>

          {/* Chips that carry each value from the invoice to the ledger */}
          {SCAN_FIELDS.map((f) => (
            <span
              key={f.key}
              data-chip={f.key}
              aria-hidden
              className="tnum pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-full border border-accent/30 bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-ink shadow-soft"
              style={{ opacity: 0 }}
            >
              {f.value}
            </span>
          ))}
        </Stage>
      </div>
      <p data-scan-hint className="mx-auto mt-3 text-center text-[13px] text-muted">
        Every value traced back to the invoice it came from.
      </p>
    </div>
  );
}

export default function DocumentWorkflow() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      const mm = documentWorkflowAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} id="how-it-works" aria-labelledby="docs-title" className="relative py-24 sm:py-28 lg:flex lg:h-svh lg:flex-col lg:pb-5 lg:pt-20 motion-mobile:flex motion-mobile:h-svh motion-mobile:flex-col motion-mobile:pb-[112px] motion-mobile:pt-12">
      <SectionHeading id="docs-title" eyebrow="Prepare" title="From paperwork to prepared books." className="container-x" pinned>
        <Brand className="font-medium text-ink" /> reads invoices, receipts and bank statements, then prepares the entries for your team.
      </SectionHeading>
      <div data-desktop className="container-x mt-6 hidden min-h-0 flex-1 lg:block">
        <DesktopScene />
      </div>
      <MobileScene />
    </section>
  );
}
