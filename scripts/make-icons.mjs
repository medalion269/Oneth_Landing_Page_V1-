// Renders the home-screen icons that app/manifest.ts lists, from the one source, app/icon.svg (docs/DECISIONS.md, L31):
//   public/icon-192.png           192 px, transparent corners (Android home screen, Chrome's install and tab-search UI)
//   public/icon-512.png           512 px, the same (splash screens, app lists)
//   public/icon-maskable-512.png  512 px, the tile colour to every edge and the mark inside the 80% safe circle, so
//                                 Android can cut it to a circle or a squircle without clipping the mark
// favicon.ico, icon.svg and apple-icon.png already sit in app/, where Next links them itself. Re-run this after
// changing app/icon.svg:
//
//   cd landing
//   node scripts/make-icons.mjs
//
// Uses the Playwright that the app (../frontend) already installs, as scripts/og-image.mjs does.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("../../frontend/node_modules/playwright");

const svg = readFileSync(fileURLToPath(new URL("../app/icon.svg", import.meta.url)), "utf8");
const tile = /<rect[^>]*\sfill="(#[0-9a-fA-F]{6})"/.exec(svg)?.[1];
if (!tile) throw new Error("app/icon.svg: no background <rect> with a fill");
const src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

// The mark spans about 76..484 of the icon's 560 units, so its corners are 0.515 of the icon's width from the
// centre. Drawn at 384 px on a 512 px canvas they are 198 px out, inside the safe circle's 204.8 px.
const MASKABLE_MARK = 384;

/** A square PNG of `size` px with the icon drawn at `mark` px in the middle, on `background` or transparent. */
async function render(browser, size, mark = size, background) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(
    `<body style="margin:0;display:grid;place-items:center;width:${size}px;height:${size}px;background:${background ?? "transparent"}">` +
      `<img src="${src}" width="${mark}" height="${mark}" style="display:block"></body>`,
  );
  await page.locator("img").evaluate((img) => img.decode());
  const png = await page.screenshot({ omitBackground: background === undefined });
  await page.close();
  return png;
}

const browser = await chromium.launch();
try {
  writeFileSync(out("icon-192.png"), await render(browser, 192));
  writeFileSync(out("icon-512.png"), await render(browser, 512));
  writeFileSync(out("icon-maskable-512.png"), await render(browser, 512, MASKABLE_MARK, tile));
} finally {
  await browser.close();
}
console.log("make-icons: wrote public/icon-192.png, public/icon-512.png and public/icon-maskable-512.png");
