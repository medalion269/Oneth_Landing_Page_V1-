"use client";

import { useRef, type CSSProperties } from "react";
import AccountingDashboard from "./AccountingDashboard";
import HeroApp from "./hero-app/HeroApp";
import Brand from "./Brand";
import { IconArrowRight } from "./icons";
import { heroAnimation, useGSAP } from "@/lib/animations";
import { onAnchorClick } from "@/lib/scroll";
import { requestFormMode } from "@/lib/form-mode";

// Word-by-word reveal: each word gets a global index for its stagger delay.
const lines = [
  // "client base." stays together (no-break space), so narrow screens never leave "base." alone on a line
  { words: ["Grow", "your", "client base."], className: "" },
  { words: ["Not", "your", "payroll."], className: "text-muted" },
].map((line, li, all) => {
  const offset = all.slice(0, li).reduce((n, l) => n + l.words.length, 0);
  return { ...line, words: line.words.map((text, wi) => ({ text, i: offset + wi })) };
});

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  // The pin-spacer is rendered here so ScrollTrigger never moves the section in the DOM (that restarts its CSS intro).
  const spacer = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!root.current) return;
      const mm = heroAnimation(root.current, spacer.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={spacer}>
      <section ref={root} id="top" aria-labelledby="hero-title" className="relative overflow-clip motion-desktop:h-svh">
        <div
          aria-hidden
          className="grid-bg pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_20%,transparent_80%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-18rem] h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(3_63_254/0.10),transparent)]"
        />

        <div data-hero-copy className="container-x relative z-10 pb-14 pt-32 text-center sm:pt-40 motion-desktop:pb-0 motion-desktop:pt-[clamp(7rem,19svh,11rem)]">
          <h1 id="hero-title" className="display mx-auto max-w-5xl text-[clamp(2.6rem,min(7vw,10svh),6rem)]">
            {lines.map((line, li) => (
              <span key={li} className={`block ${line.className}`}>
                {line.words.map((w, wi) => (
                  <span key={w.i}>
                    <span className="word-mask">
                      <span style={{ "--i": w.i } as CSSProperties}>{w.text}</span>
                    </span>
                    {wi < line.words.length - 1 ? " " : ""}
                  </span>
                ))}
              </span>
            ))}
          </h1>

          <p className="anim-rise mx-auto mt-6 max-w-[46rem] text-pretty text-[clamp(1.05rem,1.35vw,1.25rem)] leading-relaxed text-muted" style={delay(520)}>
            <Brand className="font-medium text-ink" /> handles repetitive bookkeeping work. Your team reviews and approves.
          </p>

          <div className="anim-rise mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={delay(660)}>
            <a
              href="#pilot"
              onClick={(e) => {
                requestFormMode("pilot");
                onAnchorClick(e);
              }}
              className="btn btn-primary w-full sm:w-auto"
            >
              Apply for a free pilot <IconArrowRight size={16} />
            </a>
            <a href="#how-it-works" onClick={onAnchorClick} className="btn btn-ghost w-full sm:w-auto">
              See how it works
            </a>
          </div>
          <p className="anim-rise mt-5 text-[14px] text-muted" style={delay(780)}>
            One client. One month. No cost or commitment.
          </p>
        </div>

        {/* Desktop: the app itself, clickable. With motion it starts tilted below the fold and scrolls into the screen. */}
        <div className="hero-dash-stage relative hidden px-8 pb-24 pt-16 lg:block motion-desktop:p-0">
          <div data-hero-dash className="hero-dash mx-auto h-[min(820px,86svh)] max-w-[1280px] motion-desktop:max-w-none">
            <div className="hero-dash-enter h-full" role="region" aria-label="A clickable preview of the oneth app in shadow mode, with fictional data">
              <HeroApp />
            </div>
          </div>
        </div>

        {/* Mobile and tablet: compact, readable product UI */}
        <div className="container-x relative pb-20 lg:hidden">
          <div className="mx-auto max-w-xl">
            <div className="hero-dash-enter" role="img" aria-label="The oneth app's Overview: 9 tasks completed today, 14 decisions awaiting review and the decisions that need a person.">
              <AccountingDashboard />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
