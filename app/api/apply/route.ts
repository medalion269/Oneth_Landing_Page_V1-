import { NextResponse } from "next/server";
import { FIRM_SIZES, validateSubmission, type Submission, type SubmitResponse } from "@/lib/validation";

/**
 * POST /api/apply
 *
 * Receives pilot applications and waitlist signups.
 * Delivery is chosen from environment variables (see .env.example); the first one configured wins:
 *   1. Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *   2. Any JSON endpoint (SUBMISSION_ENDPOINT, optional SUBMISSION_ENDPOINT_TOKEN)
 *   3. An email per submission through Resend (RESEND_API_KEY + RESEND_TO, optional RESEND_FROM)
 *   4. None set: development mode. The request is validated, nothing is
 *      stored, and the response says so explicitly (saved: false).
 */

/** Resend's own test sender. It only delivers to the address the Resend account was created with. */
const RESEND_TEST_FROM = "oneth <onboarding@resend.dev>";

type Backend =
  | { kind: "supabase"; url: string; key: string; pilotTable: string; waitlistTable: string }
  | { kind: "endpoint"; url: string; token?: string }
  | { kind: "resend"; key: string; to: string[]; from: string }
  | { kind: "none" };

function resolveBackend(): Backend {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUBMISSION_ENDPOINT, RESEND_API_KEY, RESEND_TO } = process.env;
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    return {
      kind: "supabase",
      url: SUPABASE_URL.replace(/\/+$/, ""),
      key: SUPABASE_SERVICE_ROLE_KEY,
      pilotTable: process.env.SUPABASE_PILOT_TABLE || "pilot_applications",
      waitlistTable: process.env.SUPABASE_WAITLIST_TABLE || "waitlist",
    };
  }
  if (SUBMISSION_ENDPOINT) {
    return { kind: "endpoint", url: SUBMISSION_ENDPOINT, token: process.env.SUBMISSION_ENDPOINT_TOKEN || undefined };
  }
  const to = (RESEND_TO || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (RESEND_API_KEY && to.length) {
    return { kind: "resend", key: RESEND_API_KEY, to, from: process.env.RESEND_FROM?.trim() || RESEND_TEST_FROM };
  }
  return { kind: "none" };
}

/** One line, so visitor input can't break the subject header. */
const oneLine = (s: string) => s.replace(/[\r\n\t]+/g, " ").trim();

/**
 * Plain text only: nothing the visitor typed is ever rendered as HTML. Every value is kept to one line, so a
 * visitor can't add lines that look like part of the email. Replies go to the visitor.
 */
function toEmail(raw: Submission) {
  const data = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, typeof v === "string" ? oneLine(v) : v]),
  ) as Submission;
  const when = new Date().toLocaleString("en-GB", { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" });
  if (data.type === "pilot") {
    const size = FIRM_SIZES.find((s) => s.value === data.firmSize)?.label ?? data.firmSize;
    return {
      subject: `Pilot application: ${data.firmName} (${data.fullName})`,
      text: [
        "New pilot application from oneth.ai",
        "",
        `Name:      ${data.fullName}`,
        `Email:     ${data.email}`,
        `Firm:      ${data.firmName}`,
        `Firm size: ${size}`,
        `Phone:     ${data.phone}`,
        `Submitted: ${when} (UAE time)`,
        "",
        "Reply to this email to answer them directly.",
      ].join("\n"),
    };
  }
  return {
    subject: `Waitlist signup: ${data.email}${data.firmName ? ` (${data.firmName})` : ""}`,
    text: [
      "New waitlist signup from oneth.ai",
      "",
      `Email:     ${data.email}`,
      `Firm:      ${data.firmName || "(not given)"}`,
      `Submitted: ${when} (UAE time)`,
      "",
      "Reply to this email to answer them directly.",
    ].join("\n"),
  };
}

function toRow(data: Submission) {
  if (data.type === "pilot") {
    return {
      full_name: data.fullName,
      email: data.email,
      firm_name: data.firmName,
      firm_size: data.firmSize,
      phone: data.phone,
      source: "oneth.ai",
    };
  }
  return { email: data.email, firm_name: data.firmName || null, source: "oneth.ai" };
}

async function store(backend: Exclude<Backend, { kind: "none" }>, data: Submission) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    let res: Response;
    if (backend.kind === "supabase") {
      const table = data.type === "pilot" ? backend.pilotTable : backend.waitlistTable;
      res = await fetch(`${backend.url}/rest/v1/${encodeURIComponent(table)}`, {
        method: "POST",
        headers: {
          apikey: backend.key,
          Authorization: `Bearer ${backend.key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(toRow(data)),
        signal: controller.signal,
      });
    } else if (backend.kind === "resend") {
      const { subject, text } = toEmail(data);
      res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${backend.key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: backend.from, to: backend.to, subject, text, reply_to: data.email }),
        signal: controller.signal,
      });
    } else {
      res = await fetch(backend.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(backend.token ? { Authorization: `Bearer ${backend.token}` } : {}),
        },
        body: JSON.stringify({ ...data, submittedAt: new Date().toISOString(), source: "oneth.ai" }),
        signal: controller.signal,
      });
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Backend responded ${res.status}: ${detail.slice(0, 300)}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

const json = (body: SubmitResponse, status = 200) => NextResponse.json(body, { status });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "Invalid request body." }, 400);
  }

  // Honeypot: real visitors never fill this hidden field.
  if (body && typeof body === "object" && "website" in body && (body as { website?: unknown }).website) {
    return json({ ok: true, saved: false, mode: "development" });
  }

  const result = validateSubmission(body);
  if (!result.ok) return json({ ok: false, errors: result.errors }, 422);

  const backend = resolveBackend();
  if (backend.kind === "none") {
    console.info(`[oneth] Development mode: ${result.data.type} submission validated but NOT stored. Configure .env to save submissions.`);
    return json({ ok: true, saved: false, mode: "development" });
  }

  try {
    await store(backend, result.data);
    return json({ ok: true, saved: true, mode: "live" });
  } catch (error) {
    console.error("[oneth] Failed to store submission", error);
    return json({ ok: false, message: "We could not save your details just now. Please try again in a moment." }, 502);
  }
}
