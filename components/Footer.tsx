import type { ReactNode } from "react";
import Brand, { Wordmark } from "./Brand";
import { signInUrl } from "@/lib/app-url";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#reconciliation", label: "Reconciliation" },
  { href: "#review", label: "Review" },
  { href: "#features", label: "Features" },
  { href: "#capacity", label: "Calculator" },
  { href: "#pilot", label: "Free pilot" },
];

const linkCls = "inline-flex min-h-8 items-center text-muted transition-colors hover:text-ink";

/**
 * The page ends on dunes at sunrise: the logo's square rises behind hairline ridges and its rays open out
 * as the footer comes into view (`.footer-scene` in globals.css, CSS scroll-driven). The markup is the
 * finished picture, so reduced motion and browsers without scroll timelines see it whole.
 */
export default function Footer() {
  return (
    // Below 1024 the tab bar rises by the iPhone's home-indicator inset; the scene rises with it, keeping the sun clear
    <footer className="footer-scene overflow-clip border-t border-line max-lg:pb-[env(safe-area-inset-bottom)]">
      <div className="container-x relative z-10 pt-14 sm:pt-16">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Wordmark className="h-[28px]" />
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-muted">
              Operations software for accounting and bookkeeping firms in the UAE. It prepares the work. Your team reviews and approves.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-7 gap-y-1 text-[14px] lg:max-w-xl lg:justify-end lg:pt-1">
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className={linkCls}>
                    {l.label}
                  </a>
                </li>
              ))}
              {signInUrl && (
                <li>
                  <a href={signInUrl} className={linkCls}>
                    Sign in to oneth
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-1 border-t border-line pt-5 text-[13px] text-muted sm:flex-row sm:justify-between">
          <p>
            © 2026 <Brand />. oneth.ai
          </p>
          <p>Pre-launch. Pilot spots for UAE firms are limited.</p>
        </div>
      </div>
      {/* The box keeps the scene's proportions (1600 x 520) from 1024 to 1960 wide, so the top of the sky,
          where the rays have faded out, is never cut. Below 1024 the tab bar covers the nearest dunes, not the sun.
          It slides up under the text (which sits above it), so the text ends close to the sunrise. */}
      <div aria-hidden className="pointer-events-none -mt-20 h-[clamp(300px,32.5vw,640px)] w-full">
        <DuneSunrise />
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* The drawing                                                          */
/* ------------------------------------------------------------------ */

type Pt = [number, number];
const f = (n: number) => n.toFixed(1);

/**
 * A dune ridge through alternating troughs and crests, with the wind from the left: a long, gentle
 * windward slope up to a sharp crest, then a short, steep slip face down into the next trough.
 */
function ridge(pts: Pt[]) {
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [[x1, y1], [x2, y2]] = [pts[i], pts[i + 1]];
    const dx = x2 - x1;
    const h = Math.abs(y2 - y1);
    const c =
      y2 < y1
        ? [x1 + dx * 0.3, y1 - h * 0.5, x2 - dx * 0.32, y2 + h * 0.03] // windward: a convex slope that levels off at the brink
        : [x1 + dx * 0.22, y1 + h * 0.72, x2 - dx * 0.35, y2]; // slip face: a straight, steep fall that flattens into the hollow
    d += ` C${f(c[0])} ${f(c[1])} ${f(c[2])} ${f(c[3])} ${f(x2)} ${f(y2)}`;
  }
  return d;
}

// Far to near (trough, crest, trough...), between y 0 and 320. Nearer ridges are darker.
const DUNES = [
  { pts: [[-100, 150], [150, 120], [330, 152], [560, 106], [720, 150], [980, 122], [1140, 152], [1420, 110], [1700, 150]] as Pt[], ink: 0.16 },
  { pts: [[-80, 196], [240, 152], [420, 198], [700, 162], [880, 200], [1180, 148], [1360, 198], [1560, 170], [1720, 198]] as Pt[], ink: 0.24 },
  { pts: [[-120, 236], [120, 198], [300, 240], [620, 190], [820, 238], [1060, 202], [1240, 242], [1500, 194], [1700, 240]] as Pt[], ink: 0.32 },
  { pts: [[-60, 276], [320, 228], [520, 280], [860, 238], [1060, 282], [1380, 232], [1620, 282]] as Pt[], ink: 0.42 },
  { pts: [[-100, 318], [200, 274], [420, 320], [820, 268], [1080, 320], [1460, 272], [1700, 320]] as Pt[], ink: 0.55 },
].map(({ pts, ink }) => ({ line: ridge(pts), ink }));

// Rays across the upper half, 5 degrees apart, long and short in turn (none flat along the horizon),
// starting clear of the square's corners.
const RAYS = Array.from({ length: 35 }, (_, n) => {
  const i = n + 1;
  const a = Math.PI + (i / 36) * Math.PI;
  const [r0, r1] = [86, i % 2 ? 360 : 640];
  return { long: i % 2 === 0, d: `M${f(Math.cos(a) * r0)} ${f(Math.sin(a) * r0)}L${f(Math.cos(a) * r1)} ${f(Math.sin(a) * r1)}` };
});
const LONG_RAYS = RAYS.filter((r) => r.long).map((r) => r.d).join("");
const SHORT_RAYS = RAYS.filter((r) => !r.long).map((r) => r.d).join("");

const stop = (offset: number, opacity: number): ReactNode => (
  <stop offset={offset} style={{ stopColor: "var(--color-accent)", stopOpacity: opacity }} />
);

/**
 * 200 of sky above the dunes so the rays have room. The sun is the logo's square (same corner ratio),
 * low on the horizon; each ridge is filled with the page colour, so the nearer dunes hide its lower edge
 * and the rays near the ground.
 */
function DuneSunrise() {
  return (
    <svg viewBox="0 -200 1600 520" preserveAspectRatio="xMidYMax slice" className="block h-full w-full">
      <defs>
        {/* Wider than tall: the light reaches along the horizon and is gone 320 above the sun, at the scene's top */}
        <radialGradient id="footer-ray-fade" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="320" gradientTransform="scale(1.8 1)">
          {stop(0.2, 0.6)}
          {stop(0.6, 0.2)}
          {stop(1, 0)}
        </radialGradient>
        <radialGradient id="footer-glow" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="260">
          {stop(0, 0.16)}
          {stop(1, 0)}
        </radialGradient>
      </defs>
      <g className="footer-sunrise">
        <g transform="translate(870 120)">
          <g className="footer-rays">
            <circle r="260" fill="url(#footer-glow)" />
            <path d={LONG_RAYS} fill="none" stroke="url(#footer-ray-fade)" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
            <path d={SHORT_RAYS} fill="none" stroke="url(#footer-ray-fade)" strokeWidth="1" strokeOpacity="0.7" vectorEffect="non-scaling-stroke" />
          </g>
          <rect className="fill-accent" x="-40" y="-40" width="80" height="80" rx="12.5" />
        </g>
      </g>
      {DUNES.map(({ line, ink }, i) => (
        <g key={i}>
          <path d={`${line} L1700 400 L-120 400 Z`} fill="var(--color-canvas)" />
          <path d={line} fill="none" stroke="var(--color-ink)" strokeOpacity={ink} vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </svg>
  );
}
