"use client";

import { useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Brand from "./Brand";
import SectionHeading from "./SectionHeading";
import { IconAlert, IconArrowRight, IconCheck } from "./icons";
import { capacityAnimation, ScrollTrigger, useGSAP } from "@/lib/animations";
import { onAnchorClick } from "@/lib/scroll";
import { requestFormMode } from "@/lib/form-mode";
import { validateEmail, type SubmitResponse } from "@/lib/validation";
import { HOURS_A_MONTH_EACH, HOURS_PER_WEEK, LIMITS, NBSP, ONETH_ESTIMATE, STUDY, capacity, group, headline, workings, type Firm } from "@/lib/capacity";

/*
 * The calculator, as a short form: three questions one at a time (accountants, clients, the average fee; L18), then
 * the answer, then the same answer as a PDF in exchange for an email. Everything else is ours and the page says so: a
 * typical UAE office week (HOURS_PER_WEEK) and oneth's labelled estimate of the time it takes off a client's month
 * (ONETH_ESTIMATE, the sum of TASKS, L26). The results lay the sums out in the order the user drew them on a whiteboard
 * (L16). The PDF is a value report, made in the browser (lib/capacity-pdf.ts); the email and answers go to the firm
 * through /api/apply.
 */

type Answers = { accountants: number | null; clients: number | null; fee: number | null };
const EMPTY: Answers = { accountants: null, clients: null, fee: null };
const QUESTIONS = 3;

const done = (a: Answers): a is { [K in keyof Answers]: NonNullable<Answers[K]> } =>
  a.accountants !== null && a.clients !== null && a.fee !== null;

/** One question: the big title, a line of help, and the answer underneath. */
function Question({ n, title, help, htmlFor, children }: { n: number; title: ReactNode; help: ReactNode; htmlFor?: string; children: ReactNode }) {
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
function NumberAnswer({ id, value, onChange, min, max, step = 1, prefix, suffix, placeholder }: {
  id: string;
  value: number | null;
  onChange: (n: number | null) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  /** The unit after the number, like "hours" */
  suffix?: string;
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
          } ${suffix ? "pr-20" : "pr-4"}`}
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
        {suffix && <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[15px] text-muted">{suffix}</span>}
      </div>
      <button type="button" aria-label="More" className={btn} disabled={value !== null && value >= max} onClick={() => nudge(step)}>
        +
      </button>
    </div>
  );
}

function Tile({ label, value, sub, className = "" }: { label: string; value: string; sub: string; className?: string }) {
  return (
    <div className={`min-w-0 rounded-2xl border border-line bg-paper p-4 ${className}`}>
      <p className="text-[13px] text-muted">{label}</p>
      {/* Amounts keep "AED" with the number (a no-break space) and only break, mid-number, if one can't fit at all */}
      <p data-tile-value className="mt-1 text-[clamp(1.5rem,2.2vw,1.75rem)] font-semibold tracking-[-0.03em] text-accent-ink tnum wrap-anywhere">
        {value}
      </p>
      <p className="mt-0.5 text-[12.5px] leading-snug text-muted">{sub}</p>
    </div>
  );
}

export default function CapacityCheck() {
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const uid = useId();
  const [a, setA] = useState<Answers>(EMPTY);
  const [step, setStep] = useState(0); // 0 to 2: the questions; 3: the results

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
    a.accountants !== null && a.accountants >= LIMITS.accountants.min,
    a.clients !== null && a.clients >= LIMITS.clients.min,
    a.fee !== null && a.fee >= LIMITS.fee.min,
  ];

  const next = (e: FormEvent) => {
    e.preventDefault();
    if (step < QUESTIONS && valid[step]) go(step + 1);
  };

  const id = (k: string) => `${uid}-${k}`;

  return (
    // The negative margin borrows the space below Features, so a link jump lands with room above the heading
    <section ref={root} id="capacity" aria-labelledby="capacity-title" className="relative -mt-16 pt-16">
      <div className="container-x">
        <SectionHeading id="capacity-title" eyebrow="Your firm in numbers" title="How many more clients can your team take?">
          Three quick questions about your firm. See how many clients your team could handle with <Brand />, what that adds in fees, and
          get the answer as a PDF report.
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
                  <Question n={1} htmlFor={id("accountants")} title="How many accountants does your firm have?" help="Everyone who prepares or reviews clients' books, including you.">
                    <NumberAnswer id={id("accountants")} value={a.accountants} onChange={set("accountants")} {...LIMITS.accountants} placeholder="6" />
                  </Question>
                )}
                {step === 1 && (
                  <Question n={2} htmlFor={id("clients")} title="How many clients does your firm have?" help="Clients whose books your team keeps every month.">
                    <NumberAnswer id={id("clients")} value={a.clients} onChange={set("clients")} {...LIMITS.clients} placeholder="28" />
                  </Question>
                )}
                {step === 2 && (
                  <Question n={3} htmlFor={id("fee")} title="What does each client pay you a month, on average?" help="Your monthly fee per client, roughly. It's what each extra client would bring in.">
                    <NumberAnswer id={id("fee")} value={a.fee} onChange={set("fee")} {...LIMITS.fee} step={500} prefix="AED" placeholder="4,500" />
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
            <Results
              firm={{ accountants: a.accountants, clients: a.clients, fee: a.fee }}
              onChange={() => go(0)}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

type PdfState = { status: "idle" } | { status: "working" } | { status: "done"; url: string } | { status: "error"; email?: string; form?: string };

/** One line of the sums: what it is, the sum, and its result. On phones the sum goes under the other two. */
function Step({ label, sum, result, accent = false }: { label: ReactNode; sum: string; result: string; accent?: boolean }) {
  const tone = accent ? "text-accent-ink" : "text-ink";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-0.5 py-2.5 sm:grid-cols-[11rem_minmax(0,1fr)_auto]">
      <dt className={`text-[14px] font-medium ${tone}`}>{label}</dt>
      <dd className="col-span-2 row-start-2 text-[13px] text-muted tnum sm:col-span-1 sm:col-start-2 sm:row-start-1">{sum}</dd>
      <dd className={`col-start-2 row-start-1 text-right text-[15px] font-semibold tnum sm:col-start-3 ${tone}`}>{result}</dd>
    </div>
  );
}

/** A label with the product's name drawn by the Brand component */
function withBrand(label: string): ReactNode {
  const [before, after] = label.split("oneth");
  return after === undefined ? (
    label
  ) : (
    <>
      {before}
      <Brand />
      {after}
    </>
  );
}

function Results({ firm, onChange }: { firm: Firm; onChange: () => void }) {
  const uid = useId();
  const c = capacity(firm);
  const w = workings(firm);
  const [email, setEmail] = useState("");
  const [firmName, setFirmName] = useState("");
  const [pdf, setPdf] = useState<PdfState>({ status: "idle" });

  const aed = (n: number) => `AED${NBSP}${group(n)}`;

  const download = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = "oneth-value-report.pdf";
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
        body: JSON.stringify({ type: "report", email, firmName, ...firm, website: honeypot }),
      });
      const body = (await res.json().catch(() => null)) as SubmitResponse | null;
      if (res.status === 422 && body && !body.ok) return setPdf({ status: "error", email: body.errors?.email, form: body.errors?.form });
      // Anything else (sent, development mode, or the inbox briefly unreachable): the visitor still gets their report
    } catch {
      // Offline: still make the report
    }
    try {
      const { capacityReportPdf } = await import("@/lib/capacity-pdf");
      const bytes = await capacityReportPdf(firm, { email: email.trim(), firmName: firmName.trim() });
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
          {headline(firm)}
        </p>

        {/* Side by side only from 1024px: narrower, a seven-figure amount doesn't fit a third of the card */}
        <div className="mt-6 grid gap-2.5 lg:grid-cols-3">
          <Tile label="Clients your team could handle" value={group(c.clientsAfter)} sub={`${group(c.clients)} today`} />
          <Tile label="Fees a month at that size" value={aed(c.revenueAfter)} sub={`${aed(c.revenue)} today`} />
          <Tile label="More revenue a year" value={aed(c.moreRevenue * 12)} sub={`${aed(c.moreRevenue)} a month, same team`} />
        </div>

        {/* The sums, in the whiteboard's order: team hours, hours per client, the same with oneth, clients */}
        <div className="mt-6 rounded-2xl bg-canvas px-4 py-2 sm:px-5">
          <dl className="divide-y divide-line">
            {w.map((r) => (
              <Step key={r.label} label={withBrand(r.label)} sum={r.sum} result={r.result} accent={r.oneth} />
            ))}
          </dl>
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
              download="oneth-value-report.pdf"
              className="text-[14px] font-medium text-accent-ink underline underline-offset-4"
            >
              Didn&apos;t download? Open the PDF
            </a>
          </div>
        ) : (
          <form onSubmit={getPdf} noValidate>
            <p className="text-[17px] font-semibold tracking-[-0.015em]">Get your value report as a PDF</p>
            <p className="mt-1 text-[14px] leading-relaxed text-muted">
              What <Brand /> is worth to your firm, where the time comes back task by task, and how it adds up. One page to keep or share
              with your partners.
            </p>
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
          <span className="font-medium text-ink">See it on your own clients.</span> A free one-month pilot shows what <Brand /> takes off your
          team&apos;s month.
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
        Worked out from your three answers and two figures of ours. Each accountant works {HOURS_PER_WEEK} hours a week, a typical UAE office week: over 52
        weeks and 12 months, {group(HOURS_A_MONTH_EACH)} hours a month each. Your team is busy with the clients it has, so each client takes your team&apos;s
        hours divided by your clients. {ONETH_ESTIMATE}% is our estimate of the time <Brand /> takes off a client&apos;s month, task by task: invoices and bills
        arrive read, VAT-checked and coded, bank lines matched, missing documents asked for in the client&apos;s portal and VAT figures prepared, while review
        and advice stay with your team. The PDF shows each task. For comparison, a 2025 Stanford and MIT study found {STUDY.finding} among {STUDY.who}. Only
        whole clients count, each paying your average fee; more revenue is the extra clients&apos; fees with the same team, before software costs.
      </p>
    </div>
  );
}
