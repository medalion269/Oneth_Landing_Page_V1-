// Renders the share picture, app/opengraph-image.png (1200 x 630), from the page's own fonts, tokens, logo and hero line
// (docs/DECISIONS.md, L29). Re-run it when the hero line changes, then rebuild.
//
//   cd landing
//   npm run build && npx next start -p 3210 -H 127.0.0.1     (in a second terminal)
//   node scripts/og-image.mjs [out.png] [base url]
//
// Uses the Playwright that the app (../frontend) already installs.
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("../../frontend/node_modules/playwright");

const OUT = process.argv[2] ?? fileURLToPath(new URL("../app/opengraph-image.png", import.meta.url));
const BASE = process.argv[3] ?? "http://127.0.0.1:3210";

// lucide FileText, as the app draws it (18px, stroke 1.75)
const fileIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`;

// The decision on the featured invoice (lib/demo-data.ts: invoice, preparedEntry, the "desert" row's confidence).
const card = ({ wordmark, lines, chip }) => `
<div class="glow"></div>
<div class="left">
  <div class="logo">${wordmark}</div>
  <div class="mid">
    <p class="chip-accent"><span class="dot"></span>${chip}</p>
    <h1 class="display">${lines.map((l, i) => `<span class="${i ? "muted" : ""}">${l}</span>`).join("")}</h1>
    <p class="sub">oneth prepares the bookkeeping. Your team approves every entry.</p>
  </div>
  <p class="foot">Free pilot <span class="sep">·</span> oneth.ai</p>
</div>
<div class="app">
  <div class="head">
    <span class="ic">${fileIcon}</span>
    <div>
      <p class="t">Classify Desert Line Office Supplies invoice INV-2026-0418</p>
      <p class="s">Saffron Grove Restaurants LLC</p>
    </div>
  </div>
  <div class="chips"><span class="c review">Awaiting review</span><span class="c conf">Confidence 94%</span></div>
  <p class="lbl">Proposed entry</p>
  <div class="tile"><span><b>6120</b> Office supplies</span><span class="amt">Dr AED 3,550.00</span></div>
  <div class="tile"><span><b>1450</b> Input VAT recoverable</span><span class="amt">Dr AED 177.50</span></div>
  <div class="tile"><span><b>2010</b> Accounts payable</span><span class="amt">Cr AED 3,727.50</span></div>
  <div class="actions"><span class="pill ink">Approve</span><span class="pill line">Overturn</span></div>
</div>`;

const css = `
html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{position:relative;background:var(--color-canvas);color:var(--color-ink);font-family:var(--font-geist-sans);-webkit-font-smoothing:antialiased}
p,h1{margin:0}
.glow{position:absolute;left:520px;top:-300px;width:1000px;height:760px;border-radius:50%;background:radial-gradient(closest-side,rgb(3 63 254/0.10),transparent)}
.left{position:absolute;left:72px;top:60px;bottom:58px;width:620px;display:flex;flex-direction:column}
.logo svg{height:38px;width:auto;color:var(--color-ink);display:block}
.mid{margin-top:auto;margin-bottom:auto}
.chip-accent{display:inline-flex;align-items:center;gap:9px;height:36px;padding:0 15px;border-radius:999px;background:var(--color-accent-soft);color:var(--color-accent-ink);font-size:17px;font-weight:550}
.dot{width:7px;height:7px;border-radius:50%;background:var(--color-accent)}
h1.display{margin-top:22px;font-size:60px;display:flex;flex-direction:column}
.muted{color:var(--color-muted)}
.sub{margin-top:22px;font-size:25px;line-height:1.35;color:var(--color-muted);max-width:560px;letter-spacing:-0.01em}
.foot{font-size:19px;font-weight:550;color:var(--color-accent-ink);letter-spacing:-0.005em}
.sep{color:var(--color-faint);margin:0 4px}
.app{position:absolute;left:742px;top:112px;width:386px;padding:22px;background:var(--color-paper);border:1px solid var(--color-line);border-radius:24px;
  box-shadow:0 1px 2px rgb(24 24 27/0.04),0 18px 48px rgb(24 24 27/0.08);font-family:var(--font-inter);font-weight:400;font-size:13.5px;color:var(--color-ink)}
.head{display:flex;gap:12px;align-items:flex-start}
.ic{flex:none;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--color-accent-soft);color:var(--color-accent-ink)}
.t{font-weight:600;font-size:15px;line-height:1.3;letter-spacing:-0.01em}
.s{margin-top:3px;color:var(--color-muted)}
.chips{display:flex;gap:6px;margin-top:16px}
.c{display:inline-flex;align-items:center;height:26px;padding:0 10px;border-radius:999px;font-weight:600;font-size:12.5px}
.review{background:var(--color-warn-soft);color:var(--color-warn)}
.conf{background:var(--color-accent-soft);color:var(--color-accent-ink)}
.lbl{margin:18px 0 8px;color:var(--color-muted);font-size:12.5px}
.tile{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px 12px;margin-top:6px;border-radius:var(--radius-app-tile);background:var(--color-line-soft);white-space:nowrap}
.tile b{font-weight:600;margin-right:4px}
.amt{font-variant-numeric:tabular-nums;font-weight:600}
.actions{display:flex;gap:8px;margin-top:16px}
.pill{display:inline-flex;align-items:center;height:38px;padding:0 18px;border-radius:999px;font-weight:600;font-size:13.5px}
.pill.ink{background:var(--color-ink);color:var(--color-paper)}
.pill.line{border:1px solid var(--color-line);color:var(--color-ink)}
`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  const info = await page.evaluate(() => {
    const h1 = document.querySelector("#hero-title");
    return {
      htmlClass: document.documentElement.className,
      css: [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href),
      wordmark: document.querySelector('svg[aria-label="oneth"]')?.outerHTML ?? "",
      lines: h1 ? [...h1.children].map((s) => s.textContent.replace(/\s+/g, " ").trim()) : [],
      chip: h1?.previousElementSibling?.textContent.trim() ?? "",
    };
  });
  if (!info.wordmark || info.lines.length !== 2 || !info.chip) throw new Error(`Unexpected page: ${JSON.stringify(info)}`);
  const html = `<!doctype html><html class="${info.htmlClass}"><head><meta charset="utf-8">${info.css
    .map((h) => `<link rel="stylesheet" href="${h}">`)
    .join("")}<style>${css}</style></head><body>${card(info)}</body></html>`;
  // Served from the page's own origin so its font files load.
  await page.route(BASE + "/__og-card", (route) => route.fulfill({ status: 200, contentType: "text/html", body: html }));
  await page.goto(BASE + "/__og-card", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: OUT });
  console.log(`wrote ${OUT} (${info.lines.join(" / ")})`);
} finally {
  await browser.close();
}
