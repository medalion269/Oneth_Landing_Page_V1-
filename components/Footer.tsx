import Brand, { Wordmark } from "./Brand";
import { signInUrl } from "@/lib/app-url";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#reconciliation", label: "Reconciliation" },
  { href: "#review", label: "Review" },
  { href: "#features", label: "Features" },
  { href: "#pilot", label: "Free pilot" },
];

export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="container-x flex flex-col gap-8 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <Wordmark className="h-[26px]" />
          <p className="mt-3 text-[14px] leading-relaxed text-muted">
            Operations software for accounting and bookkeeping firms in the UAE. It prepares the work. Your team reviews and approves.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-10 gap-y-2 text-[14px] sm:grid-cols-1">
            {links.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="inline-flex min-h-8 items-center text-muted transition-colors hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
            {signInUrl && (
              <li>
                <a href={signInUrl} className="inline-flex min-h-8 items-center text-muted transition-colors hover:text-ink">
                  Sign in to oneth
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>
      <div className="container-x flex flex-col gap-2 border-t border-line pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 text-[13px] text-muted sm:flex-row sm:justify-between lg:pb-6">
        <p>
          © 2026 <Brand />. oneth.ai
        </p>
        <p>Pre-launch. Pilot spots for UAE firms are limited.</p>
      </div>
    </footer>
  );
}
