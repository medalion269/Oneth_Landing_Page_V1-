import { NextResponse } from "next/server";
import { validateSubmission, type Submission, type SubmitResponse } from "@/lib/validation";

/**
 * POST /api/apply
 *
 * Receives pilot applications and waitlist signups.
 * Storage is chosen from environment variables (see .env.example):
 *   1. Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 *   2. Any JSON endpoint (SUBMISSION_ENDPOINT, optional SUBMISSION_ENDPOINT_TOKEN)
 *   3. Neither set: development mode. The request is validated, nothing is
 *      stored, and the response says so explicitly (saved: false).
 */

type Backend =
  | { kind: "supabase"; url: string; key: string; pilotTable: string; waitlistTable: string }
  | { kind: "endpoint"; url: string; token?: string }
  | { kind: "none" };

function resolveBackend(): Backend {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUBMISSION_ENDPOINT } = process.env;
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
  return { kind: "none" };
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
