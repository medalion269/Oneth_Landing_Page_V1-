"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { IconArrowUpRight, IconFlow, IconGrid, IconHome, IconMail } from "./icons";
import { ScrollTrigger } from "@/lib/animations";
import { requestFormMode, type FormMode } from "@/lib/form-mode";
import { scrollToId } from "@/lib/scroll";

type Tab = {
  label: string;
  target: string;
  icon: ComponentType<{ size?: number }>;
  mode?: FormMode;
  /** First section this tab lights up for; it stays lit until the next tab's section (page order). */
  section: string;
};

const tabs: Tab[] = [
  { label: "Home", target: "top", icon: IconHome, section: "top" },
  { label: "How it works", target: "how-it-works", icon: IconFlow, section: "how-it-works" },
  { label: "Features", target: "features", icon: IconGrid, section: "features" },
  { label: "Waitlist", target: "pilot", icon: IconMail, mode: "waitlist", section: "pilot" },
];

/**
 * Phones and tablets: an app-style bottom bar instead of a top menu.
 * A glass tab bar follows the section you are reading, and a round button
 * beside it applies for the pilot from anywhere on the page.
 */
export default function MobileTabBar() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  // Light up the tab for the section at the middle of the screen. Measured on
  // every scroll frame (not with toggles), so big jumps past pinned scenes land right.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      const line = window.innerHeight * 0.55;
      let idx = 0;
      tabs.forEach((tab, i) => {
        const el = document.getElementById(tab.section);
        // A pinned section sits inside a GSAP pin-spacer; that wrapper holds its real place in the page
        const anchor = el?.parentElement?.classList.contains("pin-spacer") ? el.parentElement : el;
        if (anchor && anchor.getBoundingClientRect().top <= line) idx = i;
      });
      setActive(idx);
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    ScrollTrigger.addEventListener("refresh", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ScrollTrigger.removeEventListener("refresh", schedule);
    };
  }, []);

  // Step aside while someone is typing in the form, so the keyboard has room
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const isField = (t: EventTarget | null) => t instanceof HTMLElement && t.matches("input, select, textarea");
    const onIn = (e: FocusEvent) => isField(e.target) && (el.dataset.hide = "true");
    const onOut = (e: FocusEvent) => isField(e.target) && (el.dataset.hide = "false");
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, target: string, mode?: FormMode) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (mode) requestFormMode(mode);
    if (scrollToId(target)) e.preventDefault();
  };

  return (
    <nav
      ref={ref}
      aria-label="Sections"
      data-hide="false"
      className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-2.5 px-3 pb-[max(14px,env(safe-area-inset-bottom))] transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] data-[hide=true]:pointer-events-none data-[hide=true]:translate-y-[140%] data-[hide=true]:opacity-0 lg:hidden"
    >
      <div className="anim-rise relative flex h-[66px] min-w-0 max-w-[360px] flex-1 items-stretch rounded-full border border-white/80 bg-paper/75 p-1.5 shadow-[0_14px_36px_-12px_rgb(24_24_27/0.28),0_2px_6px_rgb(24_24_27/0.06),inset_0_1px_0_rgb(255_255_255/0.9)] backdrop-blur-xl backdrop-saturate-150">
        {/* Sliding highlight behind the active tab */}
        <span
          aria-hidden
          className="absolute inset-y-1.5 left-1.5 rounded-full bg-accent-soft transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ width: `calc((100% - 12px) / ${tabs.length})`, transform: `translateX(${active * 100}%)` }}
        />
        {tabs.map((t, i) => (
          <a
            key={t.label}
            href={`#${t.target}`}
            onClick={(e) => go(e, t.target, t.mode)}
            aria-current={active === i ? "location" : undefined}
            className={`relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-[3px] rounded-full text-[10.5px] font-medium tracking-[-0.01em] transition-colors duration-300 ${
              active === i ? "text-accent-ink" : "text-muted"
            }`}
          >
            <t.icon size={20} />
            <span className="max-w-full truncate px-0.5">{t.label}</span>
          </a>
        ))}
      </div>

      <a
        href="#pilot"
        onClick={(e) => go(e, "pilot", "pilot")}
        aria-label="Apply for a free pilot"
        className="anim-rise grid h-[66px] w-[66px] shrink-0 place-items-center rounded-full bg-accent text-white shadow-[0_14px_30px_-10px_rgb(3_63_254/0.75),inset_0_1px_0_rgb(255_255_255/0.25)] transition-transform active:scale-95"
        style={{ "--d": "120ms" } as React.CSSProperties}
      >
        <span className="flex flex-col items-center gap-[3px]">
          <IconArrowUpRight size={20} />
          <span className="text-[10.5px] font-semibold">Apply</span>
        </span>
      </a>
    </nav>
  );
}
