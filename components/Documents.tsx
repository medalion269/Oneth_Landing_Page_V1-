import type { CSSProperties, ReactNode } from "react";
import { aed, bankTransactions, client, clientUpload, formatTrn, invoice, receipt } from "@/lib/demo-data";

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

/** A UAE tax invoice from the fictional supplier. 380px wide by default. */
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
  return (
    <article
      data-invoice
      className={`rounded-[10px] border border-line bg-paper text-ink shadow-lift ${compact ? "p-4 text-[11px]" : "p-[22px] text-[10.5px]"} leading-[1.45] ${className}`}
      style={style}
    >
      <header className="flex items-start gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#1f3a37] text-[10px] font-semibold tracking-wide text-[#e9dcc2]">
          DL
        </span>
        <div className="min-w-0">
          <p className="text-[11.5px] font-semibold leading-tight">
            <Hl field="supplier" on={on("supplier")}>
              {invoice.supplier}
            </Hl>
          </p>
          <p className="mt-0.5 text-muted">{invoice.supplierAddress}</p>
        </div>
      </header>

      <div className="mt-4 flex items-end justify-between border-b border-line pb-2.5">
        <p className="text-[15px] font-semibold tracking-[-0.02em]">Tax Invoice</p>
        <p className="text-muted">
          TRN{" "}
          <Hl field="trn" on={on("trn")} className="tnum font-medium text-ink">
            {formatTrn(invoice.supplierTrn)}
          </Hl>
        </p>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2">
        <div>
          <dt className="text-muted">Invoice no.</dt>
          <dd className="mt-0.5 font-medium">
            <Hl field="number" on={on("number")} className="tnum">
              {invoice.number}
            </Hl>
          </dd>
        </div>
        <div>
          <dt className="text-muted">Invoice date</dt>
          <dd className="mt-0.5 font-medium">
            <Hl field="date" on={on("date")} className="tnum">
              {invoice.date}
            </Hl>
          </dd>
        </div>
        <div>
          <dt className="text-muted">Due date</dt>
          <dd className="tnum mt-0.5 font-medium">{invoice.due}</dd>
        </div>
      </dl>

      <div className="mt-3 rounded-md bg-canvas px-2.5 py-2">
        <p className="text-muted">Bill to</p>
        <p className="font-medium">{client.name}</p>
        <p className="tnum text-muted">TRN {formatTrn(client.trn)} · Dubai, UAE</p>
      </div>

      <div className="mt-3">
        <div className="grid grid-cols-[1fr_34px_50px_64px] gap-2 border-b border-line pb-1.5 text-muted">
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Unit</span>
          <span className="text-right">AED</span>
        </div>
        <Hl field="lines" on={on("lines")} as="div">
          {invoice.lines.map((l) => (
            <div key={l.description} className="grid grid-cols-[1fr_34px_50px_64px] gap-2 border-b border-line-soft py-1.5">
              <span className="truncate">{l.description}</span>
              <span className="tnum text-right">{l.qty}</span>
              <span className="tnum text-right">{aed(l.unitPrice)}</span>
              <span className="tnum text-right">{aed(l.amount)}</span>
            </div>
          ))}
        </Hl>
      </div>

      <div className="ml-auto mt-3 w-[62%] space-y-1">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <Hl field="subtotal" on={on("subtotal")} className="tnum">
            {aed(invoice.net)}
          </Hl>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">VAT 5%</span>
          <Hl field="vat" on={on("vat")} className="tnum">
            {aed(invoice.vat)}
          </Hl>
        </div>
        <div className="flex justify-between border-t border-line pt-1.5 text-[12px] font-semibold">
          <span>Total AED</span>
          <Hl field="total" on={on("total")} className="tnum">
            {aed(invoice.total)}
          </Hl>
        </div>
      </div>

      {!compact && <p className="mt-3 text-[9.5px] text-faint">Payment by bank transfer within {invoice.terms}. Thank you for your business.</p>}
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
