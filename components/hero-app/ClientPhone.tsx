"use client";

/**
 * The client answering from their phone, later that day. A real handset (status bar, Dynamic Island, home bar) shows
 * the firm's portal in the browser: their name and colour, not oneth's (components/PortalScene.tsx is the same portal).
 * Driven by the story's `phone` stage:
 *   question  the question, the bank line, an empty answer
 *   typing    the keyboard slides up and the answer is typed
 *   attached  the keyboard goes; the photo of the invoice is attached
 *   sent      "Answered. Thank you!"
 * Drawn at a phone's real size (Scaled) so type and spacing read like a phone, then fitted to the column.
 */

import { Camera, Check, ChevronLeft, Lock, LogOut, RotateCw } from "lucide-react";
import { InvoicePage, InvoiceThumb } from "../PortalScene";
import { aed, client, firm, portalQuestion } from "@/lib/demo-data";
import type { PhoneStage } from "@/lib/hero-story";
import { Scaled } from "./Scaled";

const WORDS = portalQuestion.answer.split(" ");
const TIME = portalQuestion.answeredAt.split(", ")[1];

const DEVICE_W = 330;
const DEVICE_H = 700;

function StatusBar() {
  return (
    <div className="relative z-20 flex h-[50px] shrink-0 items-center justify-between bg-canvas px-7 pt-1 text-[15px] font-semibold text-ink">
      <span className="tabular-nums">{TIME}</span>
      <span className="absolute left-1/2 top-[11px] h-[30px] w-[100px] -translate-x-1/2 rounded-full bg-black" />
      <span className="flex items-center gap-1.5">
        {/* signal */}
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 4.6} y={9 - i * 3} width="3.2" height={3 + i * 3} rx="0.8" fill="currentColor" />
          ))}
        </svg>
        {/* wifi */}
        <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden>
          <path d="M8 11.2 5.6 8.6a3.4 3.4 0 0 1 4.8 0L8 11.2Z" fill="currentColor" />
          <path d="M3.4 6.4a6.5 6.5 0 0 1 9.2 0l-1.3 1.3a4.6 4.6 0 0 0-6.6 0L3.4 6.4Z" fill="currentColor" />
          <path d="M1.1 4.1a9.8 9.8 0 0 1 13.8 0l-1.3 1.3a8 8 0 0 0-11.2 0L1.1 4.1Z" fill="currentColor" />
        </svg>
        {/* battery */}
        <span className="relative flex h-[12px] w-[25px] items-center rounded-[4px] border border-ink/45 p-[1.5px]">
          <span className="h-full w-[72%] rounded-[2px] bg-ink" />
          <span className="absolute -right-[3px] top-1/2 h-[4px] w-[1.5px] -translate-y-1/2 rounded-r bg-ink/45" />
        </span>
      </span>
    </div>
  );
}

/** A simplified phone keyboard with suggestions. */
function Keyboard() {
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  const key = "flex h-[40px] items-center justify-center rounded-[6px] bg-white text-[17px] text-ink shadow-[0_1px_0_rgb(0_0_0/0.3)]";
  return (
    <div className="phone-keyboard absolute inset-x-0 bottom-0 z-10 flex flex-col gap-[9px] bg-[#d3d5db] px-[4px] pb-7 pt-1.5">
      <div className="flex h-[30px] items-center justify-around text-[15px] text-ink">
        <span>terrace</span>
        <span className="h-5 w-px bg-ink/20" />
        <span>the</span>
        <span className="h-5 w-px bg-ink/20" />
        <span>Invoice</span>
      </div>
      {rows.map((r, i) => (
        <div key={r} className="flex justify-center gap-[5px]">
          {i === 2 && <span className={`${key} w-[40px] bg-[#abb0ba]! text-[14px]`}>⇧</span>}
          {[...r].map((c) => (
            <span key={c} className={`${key} w-[26px]`}>
              {c}
            </span>
          ))}
          {i === 2 && <span className={`${key} w-[40px] bg-[#abb0ba]! text-[14px]`}>⌫</span>}
        </div>
      ))}
      <div className="flex justify-center gap-[5px]">
        <span className={`${key} w-[84px] bg-[#abb0ba]! text-[15px]`}>123</span>
        <span className={`${key} w-[150px] text-[15px]`}>space</span>
        <span className={`${key} w-[84px] bg-[#abb0ba]! text-[15px]`}>return</span>
      </div>
    </div>
  );
}

function Screen({ stage }: { stage: Exclude<PhoneStage, "hidden"> }) {
  const typing = stage === "typing";
  const hasPhoto = stage === "attached" || stage === "sent";
  const sent = stage === "sent";
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[46px] bg-canvas font-app text-ink antialiased">
      <StatusBar />
      {/* The page scrolls up while the keyboard is open, as a phone keeps the field in view */}
      <div className={`flex min-h-0 flex-1 flex-col gap-3.5 px-4 pt-1 transition-transform duration-500 ${typing ? "-translate-y-[150px]" : ""}`}>
        <header className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-firm text-[13px] font-semibold text-white">{firm.initials}</span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-semibold leading-[20px]">{firm.name}</span>
              <span className="truncate text-[13px] leading-[17px] text-muted">{client.name}</span>
            </span>
          </span>
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-paper shadow-app">
            <LogOut size={17} strokeWidth={1.75} />
          </span>
        </header>
        <nav className="grid grid-cols-3 gap-1 rounded-full bg-paper p-1 shadow-app">
          {["Home", "Questions", "Upload"].map((t) => (
            <span key={t} className={`flex h-10 items-center justify-center rounded-full text-[14px] font-semibold ${t === "Questions" ? "bg-ink text-white" : "text-muted"}`}>
              {t}
            </span>
          ))}
        </nav>
        <section className="flex flex-col gap-3 rounded-[22px] bg-paper p-4 shadow-app">
          <span className="text-[13px] text-muted">From Sara Malik · 13 Nov</span>
          <p className="text-[16px] font-semibold leading-[22px]">{portalQuestion.message}</p>
          <div className="rounded-[14px] bg-line-soft px-3 py-2.5 text-[14px] leading-[19px]">
            <span className="font-semibold">{portalQuestion.line.description}</span>
            <br />
            <span className="text-muted">
              {portalQuestion.line.date} · AED {aed(portalQuestion.line.amount)}
            </span>
          </div>
          <span className="text-[13px] font-semibold text-muted">Your answer</span>
          <div className={`min-h-[78px] rounded-[14px] border px-3 py-2.5 text-[15px] leading-[21px] ${typing ? "border-firm" : "border-line"}`}>
            {stage === "question" ? (
              <span className="text-faint">Type your answer</span>
            ) : (
              <>
                {WORDS.map((word, i) => (
                  <span key={i} className={typing ? "phone-word" : ""} style={typing ? { animationDelay: `${150 + i * 150}ms` } : undefined}>
                    {word}{" "}
                  </span>
                ))}
                {typing && <span className="phone-caret ml-px inline-block h-[18px] w-[2px] translate-y-[3px] bg-firm" />}
              </>
            )}
          </div>
          {hasPhoto ? (
            <span className="phone-attach flex items-center gap-2.5 rounded-[14px] bg-line-soft p-2 text-[13px]">
              <span className="scale-[1.6] origin-left">
                <InvoiceThumb />
              </span>
              <span className="ml-5 flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{portalQuestion.photo}</span>
                <span className="text-muted">Photo · 2.1 MB</span>
              </span>
              <Check size={16} strokeWidth={2} className="shrink-0 text-ok" />
            </span>
          ) : (
            <span className="flex h-11 items-center justify-center gap-2 rounded-full border border-line text-[14px] font-semibold text-ink">
              <Camera size={17} strokeWidth={1.75} /> Add a photo
            </span>
          )}
          {sent ? (
            <span className="phone-attach flex h-12 items-center justify-center gap-2 rounded-full bg-ok-soft text-[15px] font-semibold text-ok">
              <Check size={17} strokeWidth={2} /> Answered. Thank you!
            </span>
          ) : (
            <span className={`flex h-12 items-center justify-center rounded-full text-[15px] font-semibold text-white ${hasPhoto ? "phone-press bg-firm" : "bg-firm/45"}`}>
              Send answer
            </span>
          )}
        </section>
      </div>
      {typing ? (
        <Keyboard />
      ) : (
        // The browser's address bar, at the bottom as on a phone
        <div className="relative z-10 flex shrink-0 flex-col items-center gap-2 bg-canvas px-4 pb-2 pt-2">
          <span className="flex h-11 w-full items-center justify-between rounded-[14px] bg-paper px-3 text-[14px] shadow-app">
            <ChevronLeft size={18} strokeWidth={1.75} className="text-muted" />
            <span className="flex items-center gap-1.5 text-ink">
              <Lock size={12} strokeWidth={2} className="text-muted" /> portal.rahmanco.example
            </span>
            <RotateCw size={16} strokeWidth={1.75} className="text-muted" />
          </span>
          <span className="h-[5px] w-[120px] rounded-full bg-ink" />
        </div>
      )}
    </div>
  );
}

export function ClientPhone({ stage }: { stage: Exclude<PhoneStage, "hidden"> }) {
  return (
    <div data-guide="phone" className="phone-in absolute inset-0 z-10 flex flex-col items-center gap-2 rounded-app-card bg-canvas/90 p-3 backdrop-blur-[2px]">
      <span className="text-[12px] font-semibold text-muted">{client.contact}&apos;s phone · later that day</span>
      <Scaled width={DEVICE_W} height={DEVICE_H} fit="contain" className="min-h-0 w-full flex-1">
        {/* The handset: frame, side buttons, screen */}
        <div className="relative h-full w-full rounded-[54px] bg-[#16161a] p-[9px] shadow-[0_30px_60px_-20px_rgb(0_0_0/0.45),inset_0_0_0_2px_rgb(255_255_255/0.08)]">
          <span className="absolute -left-[3px] top-[120px] h-[34px] w-[3px] rounded-l bg-[#2a2a30]" />
          <span className="absolute -left-[3px] top-[170px] h-[56px] w-[3px] rounded-l bg-[#2a2a30]" />
          <span className="absolute -left-[3px] top-[236px] h-[56px] w-[3px] rounded-l bg-[#2a2a30]" />
          <span className="absolute -right-[3px] top-[190px] h-[86px] w-[3px] rounded-r bg-[#2a2a30]" />
          <Screen stage={stage} />
        </div>
      </Scaled>
    </div>
  );
}

/**
 * The client's photo as it arrives with the answer: the Bazaar Lane tax invoice lying on a countertop, a little
 * skewed, as phones take them (the same paper, grain and light as the Client portal scene's camera).
 */
export function InvoicePhoto() {
  return (
    <figure className="flex flex-col gap-1.5">
      <div className="photo-in cam-surface relative h-[170px] w-full max-w-[260px] overflow-hidden rounded-[10px] shadow-lift">
        <svg className="absolute inset-0 h-full w-full opacity-[0.22] mix-blend-overlay" aria-hidden>
          <filter id="hero-grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#hero-grain)" />
        </svg>
        <div
          className="absolute left-1/2 top-[58%]"
          style={{
            transform: "translate(-50%, -50%) perspective(700px) rotateX(16deg) rotate(-5deg) scale(0.62)",
            filter: "drop-shadow(0 12px 12px rgb(0 0 0 / 0.4)) drop-shadow(0 2px 2px rgb(0 0 0 / 0.28))",
          }}
        >
          <InvoicePage />
        </div>
        <div className="cam-vignette absolute inset-0" />
      </div>
      <figcaption className="text-[12px] text-muted">
        {portalQuestion.photo} · from {client.contactName}
      </figcaption>
    </figure>
  );
}
