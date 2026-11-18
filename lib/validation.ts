import { CLIENT_SIZES, type ClientSize } from "./capacity";

/**
 * Shared validation for the pilot application and waitlist forms, and the calculator's report request.
 * Runs in the browser for instant feedback and again in the API route,
 * so the server never trusts client-side checks.
 */

export const FIRM_SIZES = [
  { value: "2-5", label: "2 to 5 people" },
  { value: "6-15", label: "6 to 15 people" },
  { value: "16-30", label: "16 to 30 people" },
  { value: "31-50", label: "31 to 50 people" },
  { value: "50+", label: "More than 50 people" },
] as const;

export type FirmSize = (typeof FIRM_SIZES)[number]["value"];

export interface PilotSubmission {
  type: "pilot";
  fullName: string;
  email: string;
  firmName: string;
  firmSize: FirmSize;
  phone: string;
}

export interface WaitlistSubmission {
  type: "waitlist";
  email: string;
  firmName: string;
}

/** The calculator's "get the PDF" request: who asked, and the answers the report was made from. */
export interface ReportSubmission {
  type: "report";
  email: string;
  firmName: string;
  people: number;
  clients: number;
  fee: number;
  size: ClientSize;
  /** The visitor's own estimate of the routine time saved, in percent */
  estimate: number;
}

export type Submission = PilotSubmission | WaitlistSubmission | ReportSubmission;
export type FieldErrors = Partial<Record<"fullName" | "email" | "firmName" | "firmSize" | "phone" | "form", string>>;

export type ValidationResult = { ok: true; data: Submission } | { ok: false; errors: FieldErrors };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_CHARS_RE = /^\+?[\d\s()-]+$/;

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
/** A whole number within bounds, or null */
const whole = (v: unknown, min: number, max: number) => (typeof v === "number" && Number.isInteger(v) && v >= min && v <= max ? v : null);

export function validateEmail(email: string): string | undefined {
  if (!email) return "Enter your work email.";
  if (!EMAIL_RE.test(email)) return "Enter a valid email address, like name@yourfirm.ae.";
  return undefined;
}

export function validatePhone(phone: string): string | undefined {
  if (!phone) return "Enter a contact number.";
  const digits = phone.replace(/\D/g, "");
  if (!PHONE_CHARS_RE.test(phone) || digits.length < 8 || digits.length > 15) {
    return "Enter a valid number, like +971 50 123 4567.";
  }
  return undefined;
}

export function validateSubmission(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") return { ok: false, errors: { form: "Invalid request." } };
  const raw = input as Record<string, unknown>;
  const type = raw.type;

  if (type === "waitlist") {
    const email = str(raw.email, 254).toLowerCase();
    const firmName = str(raw.firmName, 120);
    const errors: FieldErrors = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    if (Object.keys(errors).length) return { ok: false, errors };
    return { ok: true, data: { type: "waitlist", email, firmName } };
  }

  if (type === "pilot") {
    const fullName = str(raw.fullName, 120);
    const email = str(raw.email, 254).toLowerCase();
    const firmName = str(raw.firmName, 120);
    const firmSize = str(raw.firmSize, 10);
    const phone = str(raw.phone, 30);
    const errors: FieldErrors = {};

    if (fullName.length < 2) errors.fullName = "Enter your full name.";
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    if (firmName.length < 2) errors.firmName = "Enter your firm's name.";
    if (!FIRM_SIZES.some((s) => s.value === firmSize)) errors.firmSize = "Choose your firm size.";
    const phoneError = validatePhone(phone);
    if (phoneError) errors.phone = phoneError;

    if (Object.keys(errors).length) return { ok: false, errors };
    return { ok: true, data: { type: "pilot", fullName, email, firmName, firmSize: firmSize as FirmSize, phone } };
  }

  if (type === "report") {
    const email = str(raw.email, 254).toLowerCase();
    const firmName = str(raw.firmName, 120);
    const people = whole(raw.people, 1, 500);
    const clients = whole(raw.clients, 1, 5_000);
    const fee = whole(raw.fee, 1, 9_999_999);
    const size = str(raw.size, 10);
    const estimate = whole(raw.estimate, 1, 100);
    const emailError = validateEmail(email);
    if (people === null || clients === null || fee === null || estimate === null || !Object.hasOwn(CLIENT_SIZES, size)) {
      return { ok: false, errors: { ...(emailError && { email: emailError }), form: "Some answers are missing. Go back and check them." } };
    }
    if (emailError) return { ok: false, errors: { email: emailError } };
    return { ok: true, data: { type: "report", email, firmName, people, clients, fee, size: size as ClientSize, estimate } };
  }

  return { ok: false, errors: { form: "Unknown form type." } };
}

/** Shape returned by POST /api/apply */
export type SubmitResponse =
  | { ok: true; saved: true; mode: "live" }
  | { ok: true; saved: false; mode: "development" }
  | { ok: false; errors?: FieldErrors; message?: string };
