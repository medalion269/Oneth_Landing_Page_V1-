"use client";

/**
 * The Desert Line tax invoice as the firm received it: an A4 PDF in a viewer. The page is drawn at A4 proportions
 * (560 × 792) and scaled to the column, so it reads like a real document: letterhead, both TRNs, invoice details, the
 * lines with VAT per line (a UAE tax invoice shows the VAT in AED), totals with the amount in words, payment terms, the
 * company stamp and the footer. oneth's highlights sit on the fields it read (TRN, lines, VAT, total). It is a picture
 * of paper, not UI, so it uses its own ink colours.
 */

import { Download, FileText, Minus, Plus } from "lucide-react";
import { Hl } from "../Documents";
import { ICON_SM } from "../app/ui";
import { aed, client, formatTrn, invoice } from "@/lib/demo-data";
import { Scaled } from "./Scaled";

const PAGE_W = 560;
const PAGE_H = 792;

/** "3727.50" -> "Three thousand seven hundred twenty-seven dirhams and fifty fils only" (amounts under a million). */
function inWords(n: number) {
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

const COLS = "grid grid-cols-[14px_minmax(0,1fr)_26px_56px_66px_52px_72px] gap-x-1.5";

function Page() {
  const lines = invoice.lines.map((l) => ({ ...l, vat: Math.round(l.amount * 5) / 100 }));
  return (
    <div className="relative flex h-full w-full flex-col bg-white px-9 pb-7 pt-8 font-sans text-[11px] leading-[16px] text-[#1d1d20]">
      {/* Letterhead */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-[6px] bg-[#1f3a37] text-[15px] font-semibold tracking-wide text-[#e9dcc2]">DL</span>
          <div className="flex min-w-0 flex-col">
            <span className="whitespace-nowrap text-[16px] font-bold leading-[20px] tracking-[-0.01em]">{invoice.supplier}</span>
            <span className="text-[#6b6b72]">Office and stationery supplies</span>
            <span className="mt-1 text-[#6b6b72]">{invoice.supplierAddress}, UAE</span>
            <span className="text-[#6b6b72]">accounts@desertline.example · desertline.example</span>
            <span className="mt-0.5 font-semibold">
              TRN{" "}
              <Hl field="trn" on>
                {formatTrn(invoice.supplierTrn)}
              </Hl>
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-[20px] font-bold leading-[24px] tracking-[0.05em]">TAX INVOICE</span>
          <span dir="rtl" lang="ar" className="text-[14px] leading-[19px] text-[#6b6b72]">
            فاتورة ضريبية
          </span>
        </div>
      </div>
      <div className="mt-4 h-[3px] w-full rounded-full bg-[#1f3a37]" />

      {/* Bill to and invoice details */}
      <div className="mt-4 flex justify-between gap-6">
        <div className="flex w-[250px] flex-col rounded-[4px] border border-[#e3e2de] px-3 py-2">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#6b6b72]">Bill to</span>
          <span className="font-semibold">{client.name}</span>
          <span className="text-[#6b6b72]">Marina Walk, Dubai Marina</span>
          <span className="text-[#6b6b72]">Dubai, United Arab Emirates</span>
          <span className="mt-0.5">TRN {formatTrn(client.trn)}</span>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-4 self-start text-right">
          {[
            ["Invoice no.", invoice.number],
            ["Invoice date", invoice.date],
            ["Supply date", invoice.date],
            ["Due date", invoice.due],
            ["Payment terms", invoice.terms],
            ["Your PO", "SG-PO-2210"],
          ].map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-[#6b6b72]">{k}</dt>
              <dd className="font-semibold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Lines */}
      <div className="mt-5">
        <div className={`${COLS} rounded-[3px] bg-[#1f3a37] px-2 py-1.5 text-[10px] font-semibold text-white`}>
          <span>#</span>
          <span>Description</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Unit price</span>
          <span className="text-right">Taxable amt</span>
          <span className="text-right">VAT 5%</span>
          <span className="text-right">Amount AED</span>
        </div>
        <Hl field="lines" on as="div" className="block">
          {lines.map((l, i) => (
            <div key={l.description} className={`${COLS} border-b border-[#ecebe7] px-2 py-2 tabular-nums`}>
              <span className="text-[#6b6b72]">{i + 1}</span>
              <span>{l.description}</span>
              <span className="text-right">{l.qty}</span>
              <span className="text-right">{aed(l.unitPrice)}</span>
              <span className="text-right">{aed(l.amount)}</span>
              <span className="text-right">{aed(l.vat)}</span>
              <span className="text-right">{aed(l.amount + l.vat)}</span>
            </div>
          ))}
        </Hl>
      </div>

      {/* Totals */}
      <div className="mt-4 flex justify-between gap-6">
        <div className="flex max-w-[230px] flex-col gap-1 pt-1 text-[#6b6b72]">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em]">Amount in words</span>
          <span className="text-[#1d1d20]">{inWords(invoice.total)}</span>
        </div>
        <div className="flex w-[220px] flex-col gap-1 tabular-nums">
          <span className="flex justify-between">
            <span className="text-[#6b6b72]">Total taxable amount</span>
            <span>{aed(invoice.net)}</span>
          </span>
          <span className="flex justify-between">
            <span className="text-[#6b6b72]">VAT at 5%</span>
            <Hl field="vat" on>
              {aed(invoice.vat)}
            </Hl>
          </span>
          <span className="mt-1 flex justify-between border-t-2 border-[#1f3a37] pt-1.5 text-[14px] font-bold leading-[19px]">
            <span>Total AED</span>
            <Hl field="total" on>
              {aed(invoice.total)}
            </Hl>
          </span>
        </div>
      </div>

      {/* Terms, stamp and signature */}
      <div className="mt-6 flex items-end justify-between gap-6">
        <div className="flex max-w-[300px] flex-col gap-1 text-[#6b6b72]">
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.08em]">Payment</span>
          <span>
            By bank transfer within {invoice.terms} of the invoice date. Please quote {invoice.number} with your payment.
          </span>
          <span>Goods received in good condition and checked at delivery.</span>
        </div>
        <div className="flex flex-col items-center gap-1">
          <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden className="-rotate-12 opacity-80">
            <circle cx="46" cy="46" r="43" fill="none" stroke="#2c4aa8" strokeWidth="2.2" />
            <circle cx="46" cy="46" r="31" fill="none" stroke="#2c4aa8" strokeWidth="1.2" />
            <path id="stamp-arc" d="M 12 46 A 34 34 0 1 1 80 46" fill="none" />
            <text fontSize="7.6" fontWeight="700" fill="#2c4aa8" letterSpacing="0.6">
              <textPath href="#stamp-arc" startOffset="50%" textAnchor="middle">
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
          <span className="w-[120px] border-t border-[#c9c8c3] pt-1 text-center text-[10px] text-[#6b6b72]">Authorised signatory</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex justify-between border-t border-[#ecebe7] pt-2 text-[9.5px] text-[#8a8a91]">
        <span>This is a computer-generated tax invoice. Prices in UAE dirhams (AED).</span>
        <span>Page 1 of 1</span>
      </div>
    </div>
  );
}

/** The PDF in a viewer: toolbar (file, page, zoom, download), then the page on the viewer's grey. */
export function InvoicePdf() {
  return (
    <div className="hero-doc flex min-h-0 flex-col overflow-hidden rounded-app-tile border border-line bg-line">
      <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-line bg-line-soft px-3 text-[12px] text-muted">
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          <FileText {...ICON_SM} className="shrink-0" /> {invoice.file}
        </span>
        <span className="flex shrink-0 items-center gap-2.5">
          <span className="tabular-nums">1 / 1</span>
          <span className="flex items-center gap-1.5">
            <Minus {...ICON_SM} /> Fit <Plus {...ICON_SM} />
          </span>
          <Download {...ICON_SM} />
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden p-3">
        <div className="shadow-[0_1px_2px_rgb(0_0_0/0.12),0_6px_18px_-6px_rgb(0_0_0/0.25)]">
          <Scaled width={PAGE_W} height={PAGE_H}>
            <Page />
          </Scaled>
        </div>
      </div>
    </div>
  );
}
