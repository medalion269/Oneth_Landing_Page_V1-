"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import Brand from "./Brand";
import { IconAlert, IconArrowRight, IconCheck, IconChevronDown } from "./icons";
import { pilotAnimation, useGSAP } from "@/lib/animations";
import { onFormModeRequest, type FormMode } from "@/lib/form-mode";
import { FIRM_SIZES, validateSubmission, type FieldErrors, type SubmitResponse } from "@/lib/validation";

type Status = "idle" | "submitting" | "success" | "error";

const terms = ["One client", "1 month", "No cost", "No commitment"];

const steps: { title: string; body: ReactNode }[] = [
  { title: "Pick one client", body: "Choose a client whose books you know well, so you can judge the results." },
  {
    title: "We process one month",
    body: (
      <>
        <Brand /> prepares their entries and reconciliation alongside your team.
      </>
    ),
  },
  { title: "You decide", body: "Compare the prepared work with your own. Keep going only if it helps." },
];

const inputCls =
  "h-12 w-full rounded-xl border border-line bg-paper px-3.5 text-[16px] text-ink outline-none transition-[border-color,box-shadow] placeholder:text-faint focus:border-accent focus:ring-4 focus:ring-accent/15 aria-[invalid=true]:border-[#dc2626] aria-[invalid=true]:focus:ring-[#dc2626]/15";

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13.5px] font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#b91c1c]">
          <IconAlert size={14} /> {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-[12.5px] text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default function PilotForm() {
  const root = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();
  const [mode, setMode] = useState<FormMode>("pilot");
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ saved: boolean; email: string; mode: FormMode } | null>(null);

  useGSAP(
    () => {
      if (!root.current) return;
      const mm = pilotAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  useEffect(
    () =>
      onFormModeRequest((m) => {
        setMode(m);
        setErrors({});
        setMessage("");
        setStatus((s) => (s === "success" ? "idle" : s));
      }),
    [],
  );

  const id = (name: string) => `${uid}-${name}`;
  const describedBy = (name: keyof FieldErrors) => (errors[name] ? `${id(name)}-error` : undefined);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;
    const fd = new FormData(e.currentTarget);
    const payload = { ...Object.fromEntries(fd.entries()), type: mode };

    const check = validateSubmission(payload);
    if (!check.ok) {
      setErrors(check.errors);
      setStatus("idle");
      const first = Object.keys(check.errors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }

    setErrors({});
    setMessage("");
    setStatus("submitting");
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...check.data, website: fd.get("website") ?? "" }),
      });
      const data = (await res.json().catch(() => ({ ok: false }))) as SubmitResponse;
      if (data.ok) {
        setResult({ saved: data.saved, email: check.data.email, mode });
        setStatus("success");
        formRef.current?.reset();
        return;
      }
      if (data.errors) setErrors(data.errors);
      setMessage(data.message || "Please check the highlighted fields.");
      setStatus("error");
    } catch {
      setMessage("We could not reach the server. Check your connection and try again.");
      setStatus("error");
    }
  }

  const switchMode = (m: FormMode) => {
    setMode(m);
    setErrors({});
    setMessage("");
  };

  return (
    <section ref={root} id="pilot" aria-labelledby="pilot-title" className="relative overflow-clip py-24 sm:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(ellipse_60%_50%_at_30%_45%,rgb(3_63_254/0.08),transparent_70%)]"
      />
      <div className="container-x relative grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,500px)] lg:gap-x-16 lg:gap-y-10">
        <div data-heading className="lg:col-start-1 lg:row-start-1">
          <p className="eyebrow">Free pilot</p>
          <h2 id="pilot-title" className="headline mt-3 max-w-xl text-balance">
            See what <Brand /> can take off your team&apos;s plate.
          </h2>
          <p className="mt-5 max-w-lg text-pretty text-[clamp(1rem,1.2vw,1.125rem)] leading-relaxed text-muted">
            Pick one client. We&apos;ll process one month of their books alongside your team. You decide whether it helps.
          </p>
          {/* One line from 360px phones up: chips size to their column (phones, and the narrow column at 1024px), ticks only when there is room */}
          <div className="@container mt-7">
            <ul className="flex flex-wrap gap-1 @min-[23rem]:gap-1.5" aria-label="Pilot terms">
              {terms.map((t) => (
                <li
                  key={t}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-paper px-2 py-1 text-[12px] font-medium shadow-soft @min-[23rem]:px-2.5 @min-[23rem]:py-1.5 @min-[23rem]:text-[13px] @lg:px-3.5 @lg:text-[14px]"
                >
                  <IconCheck size={14} className="hidden text-accent @lg:block" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-[14px] text-muted">
            <span className="live-dot h-2 w-2 rounded-full bg-accent" /> Limited pilot spots for UAE firms
          </p>
        </div>

        {/* On phones this follows the form; on desktop it sits under the heading */}
        <div data-reveal className="lg:col-start-1 lg:row-start-2">
          <p className="text-[13px] font-medium text-muted lg:sr-only">How the pilot works</p>
          <ol className="mt-4 space-y-5 border-l border-line pl-6 lg:mt-0">
            {steps.map((s, i) => (
              <li key={s.title} className="relative">
                <span className="absolute -left-[37px] grid h-6 w-6 place-items-center rounded-full border border-line bg-paper text-[12px] font-semibold">
                  {i + 1}
                </span>
                <p className="font-semibold">{s.title}</p>
                <p className="mt-0.5 text-[14.5px] leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div data-reveal className="card rounded-3xl! p-5 shadow-lift! sm:p-7 max-lg:row-start-2 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div role="tablist" aria-label="Choose a form" className="grid grid-cols-2 rounded-full bg-canvas p-1 text-[14px] font-medium">
            {(["pilot", "waitlist"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                aria-controls={id("panel")}
                onClick={() => switchMode(m)}
                className={`min-h-10 rounded-full transition-[background-color,color,box-shadow] ${mode === m ? "bg-paper text-ink shadow-soft" : "text-muted hover:text-ink"}`}
              >
                {m === "pilot" ? "Apply for a pilot" : "Join the waitlist"}
              </button>
            ))}
          </div>

          <div id={id("panel")} role="tabpanel" className="mt-6">
            {status === "success" && result ? (
              <div className="py-4" aria-live="polite">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-accent-soft text-accent-ink">
                  <IconCheck size={22} strokeWidth={2.4} />
                </span>
                <p className="mt-5 text-[22px] font-semibold tracking-[-0.02em]">
                  {result.mode === "pilot" ? "Application received" : "You're on the waitlist"}
                </p>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">
                  {result.mode === "pilot" ? (
                    <>Thank you. We will be in touch at {result.email} to plan your pilot.</>
                  ) : (
                    <>
                      Thank you. We will let you know at {result.email} when <Brand /> opens to more firms.
                    </>
                  )}
                </p>
                {!result.saved && (
                  <div className="mt-5 flex gap-3 rounded-xl border border-[#fcd34d] bg-warn-soft p-3.5 text-[13.5px] leading-relaxed text-[#92400e]">
                    <IconAlert size={18} className="mt-0.5 shrink-0" />
                    <p>
                      <strong className="font-semibold">Development mode.</strong> This submission was validated but not saved, because no backend is
                      configured. Add Supabase or <code className="font-mono text-[12.5px]">SUBMISSION_ENDPOINT</code> settings to store submissions.
                    </p>
                  </div>
                )}
                <button type="button" onClick={() => setStatus("idle")} className="btn btn-ghost mt-6">
                  Submit another
                </button>
              </div>
            ) : (
              <form ref={formRef} noValidate onSubmit={onSubmit} className="space-y-4">
                {mode === "pilot" && (
                  <Field id={id("fullName")} label="Full name" error={errors.fullName}>
                    <input
                      id={id("fullName")}
                      name="fullName"
                      autoComplete="name"
                      className={inputCls}
                      placeholder="Aisha Rahman"
                      aria-invalid={!!errors.fullName}
                      aria-describedby={describedBy("fullName")}
                    />
                  </Field>
                )}
                <Field id={id("email")} label="Work email" error={errors.email}>
                  <input
                    id={id("email")}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    className={inputCls}
                    placeholder="aisha@yourfirm.ae"
                    aria-invalid={!!errors.email}
                    aria-describedby={describedBy("email")}
                  />
                </Field>
                <Field id={id("firmName")} label={mode === "pilot" ? "Accounting firm name" : "Accounting firm name (optional)"} error={errors.firmName}>
                  <input
                    id={id("firmName")}
                    name="firmName"
                    autoComplete="organization"
                    className={inputCls}
                    placeholder="Rahman & Co. Accountants"
                    aria-invalid={!!errors.firmName}
                    aria-describedby={describedBy("firmName")}
                  />
                </Field>
                {mode === "pilot" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id={id("firmSize")} label="Firm size" error={errors.firmSize}>
                      <div className="relative">
                        <select
                          id={id("firmSize")}
                          name="firmSize"
                          defaultValue=""
                          className={`${inputCls} appearance-none pr-10`}
                          aria-invalid={!!errors.firmSize}
                          aria-describedby={describedBy("firmSize")}
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {FIRM_SIZES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                        <IconChevronDown size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
                      </div>
                    </Field>
                    <Field id={id("phone")} label="Contact number" error={errors.phone}>
                      <input
                        id={id("phone")}
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        className={inputCls}
                        placeholder="+971 50 123 4567"
                        aria-invalid={!!errors.phone}
                        aria-describedby={describedBy("phone")}
                      />
                    </Field>
                  </div>
                )}

                {/* Honeypot for bots. Hidden from people and assistive tech. */}
                <div aria-hidden className="absolute left-[-9999px] h-px w-px overflow-hidden">
                  <label>
                    Website
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                {message && status === "error" && (
                  <p role="alert" className="flex items-center gap-2 rounded-xl bg-[#fef2f2] px-3.5 py-3 text-[13.5px] text-[#b91c1c]">
                    <IconAlert size={16} /> {message}
                  </p>
                )}

                <button type="submit" disabled={status === "submitting"} className="btn btn-accent mt-2 w-full disabled:opacity-70">
                  {status === "submitting" ? (
                    <>
                      <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Sending
                    </>
                  ) : mode === "pilot" ? (
                    <>
                      Apply for a free pilot <IconArrowRight size={16} />
                    </>
                  ) : (
                    <>
                      Join the waitlist <IconArrowRight size={16} />
                    </>
                  )}
                </button>
                <p className="text-center text-[12.5px] text-muted">
                  {mode === "pilot"
                    ? "We use these details only to contact you about the pilot."
                    : "Not ready for a pilot? We will email you when more spots open."}
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
