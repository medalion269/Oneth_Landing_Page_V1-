import { useId, type CSSProperties, type ReactNode } from "react";
import { aed, bankTransactions, client, clientUpload, formatTrn, invoice, receipt, vatOn } from "@/lib/demo-data";

export type InvoiceField = "supplier" | "trn" | "number" | "date" | "lines" | "subtotal" | "vat" | "total";

/** Wraps a value with a blue highlight box that scroll timelines can animate. */
export function Hl({
  field,
  on,
  children,
  className = "",
  as: Tag = "span",
}: {
  field: InvoiceField;
  on: boolean;
  children: ReactNode;
  className?: string;
  as?: "span" | "div";
}) {
  return (
    <Tag className={`hl ${className}`} data-field={field}>
      {on && <span className="hl-box" data-hl={field} />}
      {children}
    </Tag>
  );
}

/**
 * Paper colours. An invoice is a picture of a printed document, not UI, so it keeps its own inks (as the hero app's
 * A4 invoice does, hero-app/InvoicePdf.tsx): the supplier's dark green, near-black text, grey labels, and the blue
 * of a rubber stamp.
 */
const PAPER = "text-[#1d1d20]";
const LABEL = "text-[#6b6b72]";
const BRAND_BG = "bg-[#1f3a37]";

/** "3727.50" -> "Three thousand seven hundred twenty-seven dirhams and fifty fils only" (amounts under a million). */
export function amountInWords(n: number) {
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const under100 = (x: number) => (x < 20 ? ones[x] : `${tens[Math.floor(x / 10)]}${x % 10 ? `-${ones[x % 10]}` : ""}`);
  const under1000 = (x: number) => [x >= 100 ? `${ones[Math.floor(x / 100)]} hundred` : "", x % 100 ? under100(x % 100) : ""].filter(Boolean).join(" ");
  const whole = Math.floor(n);
  const fils = Math.round((n - whole) * 100);
  const words = [whole >= 1000 ? `${under1000(Math.floor(whole / 1000))} thousand` : "", whole % 1000 ? under1000(whole % 1000) : ""].filter(Boolean).join(" ");
  const text = `${words} dirhams${fils ? ` and ${under100(fils)} fils` : ""} only`;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** The supplier's round company stamp, slightly turned, as it lands on a signed invoice. */
export function SupplierStamp({ size = 92, className = "" }: { size?: number; className?: string }) {
  const arc = `stamp-arc-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg width={size} height={size} viewBox="0 0 92 92" aria-hidden className={`-rotate-12 opacity-80 ${className}`}>
      <circle cx="46" cy="46" r="43" fill="none" stroke="#2c4aa8" strokeWidth="2.2" />
      <circle cx="46" cy="46" r="31" fill="none" stroke="#2c4aa8" strokeWidth="1.2" />
      <path id={arc} d="M 12 46 A 34 34 0 1 1 80 46" fill="none" />
      <text fontSize="7.6" fontWeight="700" fill="#2c4aa8" letterSpacing="0.6">
        <textPath href={`#${arc}`} startOffset="50%" textAnchor="middle">
          DESERT LINE OFFICE SUPPLIES
        </textPath>
      </text>
      <text x="46" y="44" fontSize="8" fontWeight="700" fill="#2c4aa8" textAnchor="middle">
        L.L.C.
      </text>
      <text x="46" y="55" fontSize="7" fill="#2c4aa8" textAnchor="middle">
        DUBAI · U.A.E.
      </text>
    </svg>
  );
}

/**
 * The Desert Line tax invoice as printed paper: letterhead with the supplier's TRN, the bilingual title, bill-to and
 * invoice details, the lines with the VAT on each (a UAE tax invoice shows it in AED), totals with the amount in words,
 * the payment terms and the company stamp. Same document as the hero app's A4 PDF, drawn at 380px wide.
 * `compact` (the Decision screen's Document card, about 300px) keeps what a reviewer checks and fits the card: no
 * address lines, no unit price, no amount in words, stamp or footer.
 */
export function InvoiceDoc({
  highlights = [],
  className = "",
  style,
  compact = false,
}: {
  highlights?: InvoiceField[];
  className?: string;
  style?: CSSProperties;
  compact?: boolean;
}) {
  const on = (f: InvoiceField) => highlights.includes(f);
  const lines = invoice.lines.map((l) => ({ ...l, vat: vatOn(l.amount) }));
  const cols = compact ? "grid grid-cols-[minmax(0,1fr)_20px_50px_38px] gap-x-1.5" : "grid grid-cols-[8px_minmax(0,1fr)_20px_40px_48px_36px] gap-x-1.5";
  const details: [string, ReactNode][] = [
    [
      "Invoice no.",
      <Hl key="n" field="number" on={on("number")} className="tnum">
        {invoice.number}
      </Hl>,
    ],
    [
      "Invoice date",
      <Hl key="d" field="date" on={on("date")} className="tnum">
        {invoice.date}
      </Hl>,
    ],
    ["Due date", invoice.due],
    ...(compact ? [] : ([["Payment terms", invoice.terms]] as [string, ReactNode][])),
  ];
  return (
    <article
      data-invoice
      className={`rounded-[3px] bg-white font-sans ${PAPER} shadow-[0_0_0_1px_rgb(24_24_27/0.06),0_1px_2px_rgb(0_0_0/0.08),0_14px_30px_-12px_rgb(0_0_0/0.28)] ${compact ? "px-3.5 py-3.5 text-[9.5px]" : "px-5 pb-3.5 pt-5 text-[10px]"} leading-[1.45] ${className}`}
      style={style}
    >
      {/* Letterhead */}
      <header className="flex items-start gap-2.5">
        <span className={`grid shrink-0 place-items-center rounded-[5px] ${BRAND_BG} font-semibold tracking-wide text-[#e9dcc2] ${compact ? "size-7 text-[9px]" : "size-9 text-[11px]"}`}>
          DL
        </span>
        <div className="min-w-0">
          <p className={`font-bold leading-tight tracking-[-0.01em] ${compact ? "text-[11px]" : "text-[12.5px]"}`}>
            <Hl field="supplier" on={on("supplier")}>
              {invoice.supplier}
            </Hl>
          </p>
          {!compact && (
            <>
              <p className={`mt-0.5 ${LABEL}`}>Office and stationery supplies</p>
              <p className={LABEL}>{invoice.supplierAddress}, UAE</p>
            </>
          )}
          <p className="mt-0.5 font-semibold">
            TRN{" "}
            <Hl field="trn" on={on("trn")} className="tnum ml-1">
              {formatTrn(invoice.supplierTrn)}
            </Hl>
          </p>
        </div>
      </header>
      <div className={`mt-2.5 h-[3px] rounded-full ${BRAND_BG}`} />

      {/* Title, in English and Arabic */}
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className={`font-bold tracking-[0.06em] ${compact ? "text-[12px]" : "text-[14px]"}`}>TAX INVOICE</p>
        <p dir="rtl" lang="ar" className={`${LABEL} ${compact ? "text-[11px]" : "text-[12.5px]"}`}>
          فاتورة ضريبية
        </p>
      </div>

      {/* Bill to and the invoice details */}
      <div className="mt-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 rounded-[3px] border border-[#e3e2de] px-2 py-1.5">
          <p className={`text-[8px] font-semibold uppercase tracking-[0.08em] ${LABEL}`}>Bill to</p>
          <p className="font-semibold leading-snug">{client.name}</p>
          {!compact && <p className={LABEL}>Marina Walk, Dubai Marina</p>}
          <p className="tnum whitespace-nowrap">TRN {formatTrn(client.trn)}</p>
        </div>
        <dl className="grid shrink-0 grid-cols-[auto_auto] gap-x-2.5 text-right">
          {details.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className={LABEL}>{k}</dt>
              <dd className="tnum font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Lines */}
      <div className="mt-3">
        <div className={`${cols} rounded-[2px] ${BRAND_BG} px-1.5 py-1 text-[8.5px] font-semibold text-white`}>
          {!compact && <span>#</span>}
          <span>Description</span>
          <span className="text-right">Qty</span>
          {!compact && <span className="text-right">Unit</span>}
          <span className="text-right">Taxable</span>
          <span className="text-right">VAT 5%</span>
        </div>
        <Hl field="lines" on={on("lines")} as="div" className="block">
          {lines.map((l, i) => (
            <div key={l.description} className={`${cols} tnum border-b border-[#ecebe7] px-1.5 py-1.5`}>
              {!compact && <span className={LABEL}>{i + 1}</span>}
              <span className="leading-snug">{l.description}</span>
              <span className="text-right">{l.qty}</span>
              {!compact && <span className="text-right">{aed(l.unitPrice)}</span>}
              <span className="text-right">{aed(l.amount)}</span>
              <span className="text-right">{aed(l.vat)}</span>
            </div>
          ))}
        </Hl>
      </div>

      {/* Totals, with the amount in words beside them */}
      <div className="mt-2.5 flex items-start justify-between gap-3">
        {!compact && (
          <div className="max-w-[150px] pt-0.5">
            <p className={`text-[8px] font-semibold uppercase tracking-[0.08em] ${LABEL}`}>Amount in words</p>
            <p className="mt-0.5">{amountInWords(invoice.total)}</p>
          </div>
        )}
        <div className={`tnum space-y-1 ${compact ? "ml-auto w-[68%]" : "w-[168px]"}`}>
          <div className="flex justify-between gap-2">
            <span className={LABEL}>Total taxable amount</span>
            <Hl field="subtotal" on={on("subtotal")}>
              {aed(invoice.net)}
            </Hl>
          </div>
          <div className="flex justify-between gap-2">
            <span className={LABEL}>VAT at 5%</span>
            <Hl field="vat" on={on("vat")}>
              {aed(invoice.vat)}
            </Hl>
          </div>
          <div className={`flex justify-between gap-2 border-t-2 border-[#1f3a37] pt-1 font-bold ${compact ? "text-[11px]" : "text-[12.5px]"}`}>
            <span>Total AED</span>
            <Hl field="total" on={on("total")}>
              {aed(invoice.total)}
            </Hl>
          </div>
        </div>
      </div>

      {!compact && (
        <>
          {/* Payment terms, stamp and signature */}
          <div className="mt-2 flex items-end justify-between gap-3">
            <p className={`max-w-[190px] pb-1 ${LABEL}`}>
              By bank transfer within {invoice.terms} of the invoice date. Please quote {invoice.number} with your payment.
            </p>
            <div className="flex flex-col items-center">
              <SupplierStamp size={56} />
              <span className={`mt-0.5 w-[92px] border-t border-[#c9c8c3] pt-0.5 text-center text-[8.5px] ${LABEL}`}>Authorised signatory</span>
            </div>
          </div>
          <div className="mt-2 flex justify-between border-t border-[#ecebe7] pt-1.5 text-[8.5px] text-[#8a8a91]">
            <span>Computer-generated tax invoice. Prices in AED.</span>
            <span>Page 1 of 1</span>
          </div>
        </>
      )}
    </article>
  );
}

/** Thermal-style expense receipt */
export function ReceiptDoc({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <article
      className={`w-[210px] rounded-[6px] border border-line bg-paper px-4 py-4 font-mono text-[9.5px] leading-[1.5] text-ink shadow-lift ${className}`}
      style={style}
    >
      <p className="text-center text-[11px] font-semibold tracking-wide">{receipt.merchant.toUpperCase()}</p>
      <p className="text-center text-muted">{receipt.location}</p>
      <p className="mt-1 text-center text-muted">
        Receipt {receipt.number} · {receipt.date} {receipt.time}
      </p>
      <div className="my-2 border-t border-dashed border-line" />
      {receipt.items.map((i) => (
        <div key={i.name} className="flex justify-between gap-2">
          <span className="truncate">{i.name}</span>
          <span className="tnum">{aed(i.amount)}</span>
        </div>
      ))}
      <div className="my-2 border-t border-dashed border-line" />
      <div className="flex justify-between text-muted">
        <span>Net</span>
        <span className="tnum">{aed(receipt.net)}</span>
      </div>
      <div className="flex justify-between text-muted">
        <span>VAT 5%</span>
        <span className="tnum">{aed(receipt.vat)}</span>
      </div>
      <div className="mt-1 flex justify-between text-[11px] font-semibold">
        <span>TOTAL AED</span>
        <span className="tnum">{aed(receipt.gross)}</span>
      </div>
      <p className="mt-2 text-center text-muted">CARD **** 4021 · APPROVED</p>
    </article>
  );
}

/** Bank statement excerpt */
export function StatementDoc({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <article
      className={`w-[340px] rounded-[10px] border border-line bg-paper p-4 text-[10px] leading-[1.45] text-ink shadow-lift ${className}`}
      style={style}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11.5px] font-semibold">Bank statement</p>
          <p className="text-muted">Business current account ending {client.account}</p>
        </div>
        <span className="pill pill-neutral">Nov 2026</span>
      </div>
      <div className="mt-3 grid grid-cols-[42px_1fr_70px] gap-2 border-b border-line pb-1 text-muted">
        <span>Date</span>
        <span>Description</span>
        <span className="text-right">AED</span>
      </div>
      {bankTransactions.slice(0, 5).map((t) => (
        <div key={t.id} className="grid grid-cols-[42px_1fr_70px] gap-2 border-b border-line-soft py-1">
          <span className="tnum text-muted">{t.date}</span>
          <span className="truncate">{t.description}</span>
          <span className={`tnum text-right ${t.amount > 0 ? "text-ok" : ""}`}>{aed(t.amount)}</span>
        </div>
      ))}
      <div className="mt-2 flex justify-between text-muted">
        <span>Closing balance</span>
        <span className="tnum font-medium text-ink">248,610.42</span>
      </div>
    </article>
  );
}

/** A multi-page PDF the client uploaded */
export function ClientPdfDoc({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <article
      className={`w-[236px] rounded-[10px] border border-line bg-paper p-3.5 text-[10px] leading-[1.45] text-ink shadow-lift ${className}`}
      style={style}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-7 place-items-center rounded-[4px] bg-[#fdecec] text-[7.5px] font-bold text-[#c2410c]">PDF</span>
        <div className="min-w-0">
          <p className="truncate text-[10.5px] font-semibold">{clientUpload.file}</p>
          <p className="text-muted">
            {clientUpload.pages} pages · uploaded {clientUpload.uploadedAt}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-[3px] border border-line bg-canvas p-1">
            <div className="h-1 w-3/4 rounded bg-line" />
            <div className="mt-1 h-1 w-1/2 rounded bg-line" />
            <div className="mt-2 space-y-0.5">
              <div className="h-0.5 rounded bg-line" />
              <div className="h-0.5 rounded bg-line" />
              <div className="h-0.5 w-2/3 rounded bg-line" />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-muted">From {clientUpload.uploadedBy}</p>
    </article>
  );
}
