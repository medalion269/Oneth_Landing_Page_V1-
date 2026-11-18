"use client";

import { useEffect, useRef } from "react";
import { Wordmark } from "./Brand";
import { signInUrl } from "@/lib/app-url";
import { IconArrowRight } from "./icons";
import { navbarAnimation, useGSAP } from "@/lib/animations";
import { onAnchorClick } from "@/lib/scroll";
import { requestFormMode, type FormMode } from "@/lib/form-mode";

const links = [
  { href: "#how-it-works", label: "How it works" },
  // Parts of How it works: left out between 1024 and 1279 so the bar stays on one line
  { href: "#reconciliation", label: "Reconciliation", wide: true },
  { href: "#review", label: "Review", wide: true },
  { href: "#features", label: "Features" },
  { href: "#capacity", label: "Calculator" },
];

/**
 * Desktop: a floating top bar that hides while reading down and returns on scroll up.
 * Phones and tablets: just the wordmark at the top of the page. Navigation lives
 * in the app-style bottom bar (MobileTabBar).
 */
export default function Navbar() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const mm = navbarAnimation(ref.current);
      return () => mm.revert();
    },
    { scope: ref },
  );

  useEffect(() => {
    const el = ref.current;
    const onScroll = () => el?.setAttribute("data-scrolled", String(window.scrollY > 12));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, mode?: FormMode) => {
    if (mode) requestFormMode(mode);
    onAnchorClick(e);
  };

  return (
    <header ref={ref} data-scrolled="false" data-site-nav className="group/nav absolute inset-x-0 top-0 z-50 px-3 pt-3 lg:fixed">
      <div className="anim-nav">
        <nav
          aria-label="Main"
          className="mx-auto flex h-14 max-w-[1180px] items-center gap-6 rounded-full border border-transparent pl-2 pr-2 transition-[background-color,border-color,box-shadow] duration-300 sm:pl-4 lg:group-data-[scrolled=true]/nav:border-line lg:group-data-[scrolled=true]/nav:bg-paper/85 lg:group-data-[scrolled=true]/nav:shadow-soft lg:group-data-[scrolled=true]/nav:backdrop-blur-md"
        >
          <a href="#top" onClick={go} className="flex items-center gap-2 rounded-lg" aria-label="oneth home">
            <Wordmark className="h-[26px]" />
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <li key={l.href} className={"wide" in l ? "hidden xl:block" : undefined}>
                <a href={l.href} onClick={go} className="whitespace-nowrap rounded-full px-3 py-2 text-[14px] text-muted transition-colors hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            {signInUrl && (
              <a href={signInUrl} className="inline-flex whitespace-nowrap rounded-full px-3 py-2 text-[14px] text-muted transition-colors hover:text-ink">
                Sign in
              </a>
            )}
            <a href="#pilot" onClick={(e) => go(e, "waitlist")} className="inline-flex whitespace-nowrap rounded-full px-3 py-2 text-[14px] font-medium text-ink">
              Join waitlist
            </a>
            <a href="#pilot" onClick={(e) => go(e, "pilot")} className="btn btn-primary min-h-10! whitespace-nowrap px-4! text-[14px]!">
              Apply for a free pilot
              <IconArrowRight size={15} />
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
