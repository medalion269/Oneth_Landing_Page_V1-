import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Brand";
import { IconArrowRight } from "@/components/icons";

// The page for an address that doesn't exist (docs/DECISIONS.md, L31). Next sends it with status 404 and a noindex tag.
// It uses only the shared tokens, the Wordmark and the button classes, so it stays light and never shows a scene.
// No canonical: the layout's would name the home page as this page's canonical.
export const metadata: Metadata = {
  title: "Page not found · oneth",
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <main className="container-x flex min-h-svh flex-col py-6 sm:py-8">
      <Link href="/" aria-label="oneth home" className="self-start">
        <Wordmark className="h-7" />
      </Link>
      <div className="flex flex-1 flex-col items-start justify-center py-16">
        <p className="eyebrow">404</p>
        <h1 className="headline mt-3 max-w-[16ch]">This page isn&apos;t here.</h1>
        <p className="mt-5 max-w-[46ch] text-[1.05rem] leading-relaxed text-muted">
          The address may be mistyped, or the page has moved. Everything about oneth is on the home page.
        </p>
        <Link href="/" className="btn btn-primary mt-8">
          Go to the home page
          <IconArrowRight size={16} />
        </Link>
      </div>
    </main>
  );
}
