"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import { IconAlert, IconArrowRight, IconCheck } from "./icons";
import { capacityAnimation, ScrollTrigger, useGSAP } from "@/lib/animations";
import { onAnchorClick } from "@/lib/scroll";
import { requestFormMode } from "@/lib/form-mode";
import { validateEmail, type SubmitResponse } from "@/lib/validation";
import {
  CLIENT_HOURS_PER_PERSON,
  CLIENT_SIZES,
  COMFORTABLY_FULL,
  HOURS_PER_VAT_RETURN,
  MINUTES_PER_BANK_LINE,
  MINUTES_PER_PURCHASE_BILL,
  MINUTES_PER_SALES_INVOICE,
  NBSP,
  group,
  headline,
  hours,
  today,
  todayLine,
  transactions,
  withFreedTime,
  type ClientSize,
  type Firm,
} from "@/lib/capacity";

/*
 * The calculator, as a short form: five questions one at a time (people, clients, average fee, a typical client's
 * size, and the visitor's own estimate of the routine time saved), then the answer, then the same answer as a PDF in
 * exchange for an email. The estimate is never preset: no time-saving claims. The PDF is made in the browser
 * (lib/capacity-pdf.ts); the email and answers go to the firm through /api/apply like the other forms.
 */

type Answers = { people: number | null; clients: number | null; fee: number | null; size: ClientSize | null; estimate: number | null };
const EMPTY: Answers = { people: null, clients: null, fee: null, size: null, estimate: null };
const QUESTIONS = 5;
const GUESSES = [
  { value: 10, label: "A little" },
  { value: 25, label: "About a quarter" },
  { value: 50, label: "About half" },
];

const done = (a: Answers): a is { [K in keyof Answers]: NonNullable<Answers[K]> } =>
  a.people !== null && a.clients !== null && a.fee !== null && a.size !== null && a.estimate !== null;

/** One question: the big title, a line of help, and the answer underneath. */
function Question({ n, title, help, htmlFor, children }: { n: number; title: string; help: ReactNode; htmlFor?: string; children: ReactNode }) {
  const Title = htmlFor ? "label" : "legend";
  return (
    <fieldset className="min-w-0">
      <Title htmlFor={htmlFor} className="block text-[clamp(1.35rem,2.4vw,1.75rem)] font-semibold leading-tight tracking-[-0.025em] text-ink">
        <span className="sr-only">Question {n} of {QUESTIONS}: </span>
        {title}
      </Title>
      <p className="mt-2 max-w-[34rem] text-[14.5px] leading-relaxed text-muted">{help}</p>
      <div className="mt-6">{children}</div>
    </fieldset>
  );
}

/** A big whole-number field with minus and plus, shown with thousands separators except while it is being edited. */
function NumberAnswer({ id, value, onChange, min, max, step = 1, prefix, placeholder }: {
  id: string;
  value: number | null;
  onChange: (n: number | null) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  placeholder: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const nudge = (d: number) => onChange(Math.min(max, Math.max(min, (value ?? 0) + d)));
  const btn =
    "grid h-14 w-14 shrink-0 place-items-center rounded-full border border-line bg-paper text-[22px] text-ink transition-colors hover:border-ink/30 disabled:opacity-40";
  return (
    <div className="flex items-center gap-3">
      <button type="button" aria-label="Less" className={btn} disabled={value === null || value <= min} onClick={() => nudge(-step)}>
        &minus;
      </button>
      <div className="relative w-full max-w-[16rem]">
        {prefix && <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[15px] text-muted">{prefix}</span>}
        <input
          id={id}
          data-autofocus
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={placeholder}
          className={`h-14 w-full rounded-2xl border border-line bg-paper text-[24px] font-semibold tracking-[-0.02em] text-ink tnum outline-none transition-[border-color,box-shadow] placeholder:font-normal placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/15 ${
            prefix ? "pl-14" : "pl-5"
          } pr-4`}
          value={draft ?? (value === null ? "" : group(value))}
          onFocus={(e) => {
            const el = e.currentTarget;
            setDraft(value === null ? "" : String(value));
            requestAnimationFrame(() => document.activeElement === el && el.select());
          }}
          onBlur={() => setDraft(null)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
            setDraft(digits);
            onChange(digits === "" ? null : Math.min(max, Number(digits)));
          }}
        />
      </div>
      <button type="button" aria-label="More" className={btn} disabled={value !== null && value >= max} onClick={() => nudge(step)}>
        +
      </button>
    </div>
  );
}

/**
 * Answer cards: a radio group that looks like big buttons. A tap or click on a card also moves on (`onPick`); arrow
 * keys only change the choice, so keyboard users can look through the options and press Next.
 */
function Choice<T extends string | number>({ name, value, options, onChange, onPick, columns }: {
  name: string;
  value: T | null;
  options: { value: T; title: string; body: string }[];
  onChange: (v: T) => void;
  onPick: () => void;
  columns: string;
}) {
  return (
    <div className={`grid gap-2.5 ${columns}`}>
      {options.map((o, i) => (
        <label
          key={o.value}
          // detail is 0 for a click made by the keyboard (Space on the radio)
          onClick={(e) => e.detail > 0 && onPick()}
          className="group relative flex cursor-pointer flex-col rounded-2xl border border-line bg-paper p-4 transition-colors hover:border-ink/25 has-checked:border-accent has-checked:bg-accent-soft has-focus-visible:ring-4 has-focus-visible:ring-accent/20"
        >
          <input
            type="radio"
            name={name}
            value={String(o.value)}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
            {...(i === 0 ? { "data-autofocus": true } : {})}
          />
          <span className="flex items-center justify-between gap-2">
            <span className="text-[17px] font-semibold tracking-[-0.015em] group-has-checked:text-accent-ink">{o.title}</span>
            <span className="grid h-5 w-5 place-items-center rounded-full border border-line bg-paper text-transparent group-has-checked:border-accent group-has-checked:bg-accent group-has-checked:text-white">
              <IconCheck size={12} />
            </span>
          </span>
          <span className="mt-1 text-[13px] leading-snug text-muted">{o.body}</span>
        </label>
      ))}
    </div>
  );
}

function Tile({ label, value, sub, className = "" }: { label: string; value: string; sub: string; className?: string }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-line bg-paper p-4 ${className}`}>
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-1 whitespace-nowrap text-[clamp(1.5rem,2.6vw,2rem)] font-semibold tracking-[-0.03em] text-accent-ink tnum">{value}</p>
      <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{sub}</p>
    </div>
  );
}

export default function CapacityCheck() {
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const uid = useId();
  const [a, setA] = useState<Answers>(EMPTY);
  const [step, setStep] = useState(0); // 0 to 4: the questions; 5: the results
  // What was typed in "Or your own figure", kept apart from the estimate so typing 100 isn't cleared on the way at 10
  const [own, setOwn] = useState("");

  useGSAP(
    () => {
      if (!root.current) return;
      const mm = capacityAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  const set = <K extends keyof Answers>(k: K) => (v: Answers[K]) => setA((s) => ({ ...s, [k]: v }));

  /** Move to a step: keep the card in view, focus its answer, and let the scroll animations below re-measure. */
  const go = (n: number) => {
    setStep(n);
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      const el = card.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      if (top < 80) window.scrollTo({ top: window.scrollY + top - 96, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      el.querySelector<HTMLElement>("[data-autofocus]")?.focus({ preventScroll: true });
    });
  };

  const valid = [
    a.people !== null && a.people >= 1,
    a.clients !== null && a.clients >= 1,
    a.fee !== null && a.fee >= 1,
    a.size !== null,
    a.estimate !== null && a.estimate >= 1,
  ];

  const next = (e: FormEvent) => {
    e.preventDefault();
    if (step < QUESTIONS && valid[step]) go(step + 1);
  };
  /** After a card is tapped: a moment to see it selected, then on */
  const pick = () => {
    const from = step;
    window.setTimeout(() => go(from + 1), 260);
  };

  const id = (k: string) => `${uid}-${k}`;

  return (
    // The negative margin borrows the space below Features, so a link jump lands with room above the heading
    <section ref={root} id="capacity" aria-labelledby="capacity-title" className="relative -mt-16 pt-16">
      <div className="container-x">
        <SectionHeading id="capacity-title" eyebrow="Your firm in numbers" title="How many more clients can your team take?">
          Five quick questions about your firm. See how many more clients your team could take, and get the answer as a PDF report.
        </SectionHeading>

        <div ref={card} data-reveal className="card mx-auto mt-12 max-w-[880px] overflow-clip sm:mt-14">
          {/* Progress */}
          <div className="flex items-center gap-4 border-b border-line px-5 py-4 sm:px-8">
            <ol className="flex flex-1 gap-1.5" aria-hidden>
              {Array.from({ length: QUESTIONS + 1 }, (_, i) => (
                <li key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? "bg-accent" : "bg-line"}`} />
              ))}
            </ol>
            <p className="shrink-0 text-[13px] font-medium text-muted tnum" aria-live="polite">
              {step < QUESTIONS ? `Question ${step + 1} of ${QUESTIONS}` : "Your results"}
            </p>
          </div>

          {step < QUESTIONS ? (
            <form onSubmit={next} className="p-5 sm:p-8" noValidate>
              <div key={step} className="step-in">
                {step === 0 && (
                  <Question n={1} htmlFor={id("people")} title="How many people in your firm do client work?" help="Everyone who prepares or reviews clients' books, including you.">
                    <NumberAnswer id={id("people")} value={a.people} onChange={set("people")} min={1} max={500} placeholder="6" />
                  </Question>
                )}
                {step === 1 && (
                  <Question n={2} htmlFor={id("clients")} title="How many clients do you look after?" help="Clients whose books your team keeps every month.">
                    <NumberAnswer id={id("clients")} value={a.clients} onChange={set("clients")} min={1} max={5_000} placeholder="28" />
                  </Question>
                )}
                {step === 2 && (
                  <Question n={3} htmlFor={id("fee")} title="What does a client pay you a month, on average?" help="Your monthly fee per client, roughly. It's what an extra client would bring in.">
                    <NumberAnswer id={id("fee")} value={a.fee} onChange={set("fee")} min={1} max={9_999_999} step={500} prefix="AED" placeholder="4,500" />
                  </Question>
                )}
                {step === 3 && (
                  <Question n={4} title="What does a typical client's month look like?" help="Pick the closest. It sets how long their routine work takes.">
                    <Choice
                      name={id("size")}
                      value={a.size}
                      onChange={set("size")}
                      onPick={pick}
                      columns="sm:grid-cols-3"
                      options={(Object.keys(CLIENT_SIZES) as ClientSize[]).map((s) => ({
                        value: s,
                        title: CLIENT_SIZES[s].label,
                        body: `About ${group(transactions(s))} invoices, bills and bank lines a month. VAT every ${CLIENT_SIZES[s].vatReturnsPerYear === 12 ? "month" : "quarter"}.`,
                      }))}
                    />
                  </Question>
                )}
                {step === 4 && (
                  <Question
                    n={5}
                    title="How much routine time do you think you'd save?"
                    help={
                      <>
                        Imagine invoices, bills and bank lines arriving already recorded and matched, so your team only checks them. Your estimate,
                        not ours: <Brand /> hasn&apos;t measured it yet.
                      </>
                    }
                  >
                    <Choice
                      name={id("estimate")}
                      value={own ? null : a.estimate}
                      onChange={(v) => {
                        setOwn("");
                        set("estimate")(v);
                      }}
                      onPick={pick}
                      columns="grid-cols-1 sm:grid-cols-3"
                      options={GUESSES.map((g) => ({ value: g.value, title: `${g.value}%`, body: g.label }))}
                    />
                    <div className="mt-4 flex items-center gap-3">
                      <label htmlFor={id("own")} className="text-[14px] text-muted">
                        Or your own figure
                      </label>
                      <div className="relative w-24">
                        <input
                          id={id("own")}
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          className="h-11 w-full rounded-xl border border-line bg-paper pl-3.5 pr-8 text-[16px] text-ink tnum outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
                          value={own}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
                            const n = digits === "" ? null : Math.min(100, Number(digits));
                            setOwn(n === null ? "" : String(n));
                            set("estimate")(n);
                          }}
                        />
                        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-[14px] text-muted">%</span>
                      </div>
                    </div>
                  </Question>
                )}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                {step > 0 ? (
                  <button type="button" onClick={() => go(step - 1)} className="btn btn-ghost">
                    Back
                  </button>
                ) : (
                  <span className="text-[13px] text-faint">About a minute</span>
                )}
                <button type="submit" disabled={!valid[step]} className="btn btn-primary disabled:cursor-not-allowed disabled:opacity-40">
                  {step === QUESTIONS - 1 ? "See my results" : "Next"} <IconArrowRight size={16} />
                </button>
              </div>
            </form>
          ) : done(a) ? (
            <Results firm={{ people: a.people, clients: a.clients, fee: a.fee, size: a.size }} estimate={a.estimate} onChange={() => go(0)} />
          ) : null}
        </div>
      </div>
    </section>
  );
}

type PdfState = { status: "idle" } | { status: "working" } | { status: "done"; url: string } | { status: "error"; email?: string; form?: string };

function Results({ firm, estimate, onChange }: { firm: Firm; estimate: number; onChange: () => void }) {
  const uid = useId();
  const now = today(firm);
  const after = withFreedTime(firm, estimate);
  const [email, setEmail] = useState("");
  const [firmName, setFirmName] = useState("");
  const [pdf, setPdf] = useState<PdfState>({ status: "idle" });

  const scale = Math.max(now.available, now.used);
  const pct = (m: number) => `${(m * 100) / scale}%`;
  const aed = (n: number) => `AED${NBSP}${group(n)}`;

  const download = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "oneth-capacity-report.pdf";
    link.click();
  };

  const getPdf = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const emailError = validateEmail(email.trim().toLowerCase());
    if (emailError) return setPdf({ status: "error", email: emailError });
    setPdf({ status: "working" });
    const honeypot = new FormData(e.currentTarget).get("website");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "report", email, firmName, ...firm, estimate, website: honeypot }),
      });
      const body = (await res.json().catch(() => null)) as SubmitResponse | null;
      if (res.status === 422 && body && !body.ok) return setPdf({ status: "error", email: body.errors?.email, form: body.errors?.form });
      // Anything else (sent, development mode, or the inbox briefly unreachable): the visitor still gets their report
    } catch {
      // Offline: still make the report
    }
    try {
      const { capacityReportPdf } = await import("@/lib/capacity-pdf");
      const bytes = await capacityReportPdf(firm, estimate, { email: email.trim(), firmName: firmName.trim() });
      const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
      download(url);
      setPdf({ status: "done", url });
    } catch (error) {
      console.error("[oneth] Could not make the PDF", error);
      setPdf({ status: "error", form: "The PDF could not be made just now. Please try again." });
    }
  };

  const fieldCls =
    "h-12 w-full min-w-0 rounded-xl border border-line bg-paper px-3.5 text-[16px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-blocked";

  return (
    <div key="results" className="step-in">
      <div className="p-5 sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-[15px] font-semibold tracking-[-0.015em]">Your results</p>
          <button type="button" onClick={onChange} className="text-[13.5px] text-muted underline decoration-line underline-offset-4 hover:text-ink">
            Change answers
          </button>
        </div>
        {/* Focused on arrival, so a screen reader starts with the answer */}
        <p data-autofocus tabIndex={-1} className="mt-3 text-pretty text-[clamp(1.35rem,2.4vw,1.85rem)] font-semibold leading-[1.2] tracking-[-0.025em] outline-none">
          {headline(firm, estimate)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <Tile label="Hours freed a month" value={`${group(hours(after.freed))} h`} sub={`The team would be ${after.fullPercent}% full`} />
          <Tile label="More clients you could take" value={group(after.extraClients)} sub={now.room > 0 ? "On top of today's room" : "Like your typical client"} />
          <Tile label="Extra profit a month" value={aed(after.extraFees)} sub={`${aed(after.extraFees * 12)} a year, same team`} className="col-span-2 sm:col-span-1" />
        </div>

        {/* Today */}
        <div className="mt-6 rounded-2xl bg-canvas p-4 sm:p-5">
          <p className={`text-[14.5px] font-medium ${now.fullPercent > COMFORTABLY_FULL ? "text-warn" : "text-ink"}`}>{todayLine(firm)}</p>
          <div className="relative mt-4">
            <div className="flex h-3 overflow-hidden rounded-full bg-line">
              <span className="h-full bg-accent" style={{ width: pct(now.routine) }} />
              <span className="h-full bg-ink/75" style={{ width: pct(now.other) }} />
            </div>
            <span aria-hidden className="absolute -bottom-1.5 -top-1.5 w-0.5 -translate-x-1/2 rounded-full bg-ink" style={{ left: pct((now.available * COMFORTABLY_FULL) / 100) }} />
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-muted">Routine keying and matching</span> <span className="font-medium tnum">{group(hours(now.routine))} h</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 rounded-full bg-ink/75" />
              <span className="text-muted">VAT, review and clients</span> <span className="font-medium tnum">{group(hours(now.other))} h</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="h-2 w-2 rounded-full bg-line ring-1 ring-inset ring-ink/10" />
              <span className="text-muted">Free</span> <span className="font-medium tnum">{group(hours(Math.max(0, now.available - now.used)))} h</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="mx-0.5 h-2.5 w-0.5 rounded-full bg-ink" />
              <span className="text-muted">Comfortably full</span> <span className="font-medium tnum">{COMFORTABLY_FULL}%</span>
            </li>
          </ul>
        </div>
      </div>

      {/* The PDF, for an email */}
      <div className="border-t border-line bg-accent-soft/60 p-5 sm:p-8">
        {pdf.status === "done" ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="flex items-center gap-2.5 text-[15px] font-medium">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-white">
                <IconCheck size={15} />
              </span>
              Your report is ready.
            </p>
            {/* Some phones open the file instead of saving it: a plain link works everywhere */}
            <a
              href={pdf.url}
              target="_blank"
              rel="noopener"
              download="oneth-capacity-report.pdf"
              className="text-[14px] font-medium text-accent-ink underline underline-offset-4"
            >
              Didn&apos;t download? Open the PDF
            </a>
          </div>
        ) : (
          <form onSubmit={getPdf} noValidate>
            <p className="text-[17px] font-semibold tracking-[-0.015em]">Get this as a PDF report</p>
            <p className="mt-1 text-[14px] leading-relaxed text-muted">Your answers, your results and how they&apos;re worked out, on one page to keep or share with your partners.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
              <div>
                <label htmlFor={`${uid}-email`} className="sr-only">
                  Work email
                </label>
                <input
                  id={`${uid}-email`}
                  type="email"
                  autoComplete="email"
                  placeholder="Work email"
                  className={fieldCls}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={pdf.status === "error" && !!pdf.email}
                  aria-describedby={pdf.status === "error" && pdf.email ? `${uid}-email-error` : undefined}
                />
              </div>
              <div>
                <label htmlFor={`${uid}-firm`} className="sr-only">
                  Firm name (optional)
                </label>
                <input
                  id={`${uid}-firm`}
                  type="text"
                  autoComplete="organization"
                  placeholder="Firm name (optional)"
                  className={fieldCls}
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                />
              </div>
              {/* Honeypot: hidden from people, filled by bots */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
              <button type="submit" disabled={pdf.status === "working"} className="btn btn-accent h-12 disabled:opacity-60">
                {pdf.status === "working" ? "Making your PDF" : "Get the PDF"}
              </button>
            </div>
            {pdf.status === "error" && (pdf.email || pdf.form) && (
              <p id={`${uid}-email-error`} className="mt-2 flex items-center gap-1.5 text-[13px] text-blocked">
                <IconAlert size={14} /> {pdf.email ?? pdf.form}
              </p>
            )}
            <p className="mt-2.5 text-[12px] text-muted">
              Your email and answers come to the <Brand /> team, so we can follow up about your report.
            </p>
          </form>
        )}
      </div>

      <div className="flex flex-col gap-4 border-t border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="text-[14px] leading-relaxed text-muted">
          <span className="font-medium text-ink">Want the real figure?</span> A free pilot measures it on one of your clients, over one month.
        </p>
        <a
          href="#pilot"
          onClick={(e) => {
            requestFormMode("pilot");
            onAnchorClick(e);
          }}
          className="btn btn-primary shrink-0"
        >
          Apply for a free pilot <IconArrowRight size={16} />
        </a>
      </div>

      <p className="border-t border-line px-5 py-4 text-[12px] leading-relaxed text-faint sm:px-8">
        Worked out from {MINUTES_PER_SALES_INVOICE} minutes per sales invoice, {MINUTES_PER_PURCHASE_BILL} per purchase bill, {MINUTES_PER_BANK_LINE} per bank line and{" "}
        {HOURS_PER_VAT_RETURN} hours per VAT return, plus review and client time by size, against {CLIENT_HOURS_PER_PERSON} hours of client work per person a month.
        Extra profit is the new clients&apos; fees with the same team, before software costs.
      </p>
    </div>
  );
}
