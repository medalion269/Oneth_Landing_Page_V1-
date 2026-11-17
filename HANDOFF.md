# Hand-off prompt for Claude Code (VS Code)

Paste everything below the line into Claude Code, opened at the oneth repo and working inside `landing/`.

---

You are picking up an existing project: the pre-launch landing page for **oneth (oneth.ai)**, an AI operations platform for accounting and bookkeeping firms in the UAE (2 to 50 people). It prepares bookkeeping work and accountants review and approve every decision. The page exists to collect **free pilot applications** and **waitlist signups**. It lives in `landing/` of the oneth repo, next to the app (`frontend/`) and the API (`backend/`). It is a separate app: the repo's `CLAUDE.md` and the app's token lint govern `frontend/` and `backend/`, not this folder. Read `README.md` first, then the files named below before changing anything.

## Stack and commands
- Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, GSAP 3.15 with ScrollTrigger and MotionPathPlugin via `@gsap/react`, and Geist through `next/font`. Node 24.
- Do not use Three.js, Motion, scroll-smoothing libraries or video. All animation is HTML, SVG and GSAP.
- `cd landing`, `npm install`, then `npm run dev` (http://localhost:3000, or `npx next dev -p 3100` if 3000 is taken), `npm run typecheck`, `npm run lint`, `npm run build`.
- On this Windows machine ESLint and the build can run out of memory. Give Node more memory first:
  - PowerShell: `$env:NODE_OPTIONS="--max-old-space-size=4096"`
  - Git Bash: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`
- Git: the landing page was added on the branch `feat/landing` of the oneth repo (an4ndhu/oneth). Stage explicit paths (`git add landing ...`), never `git add -A`. Ask before pushing.

## Design system (current)
- Colours (Electric Blue Minimal, the palette the app is adopting too: docs/DECISIONS.md, D41):
  - background `#F8F7F4`, cards `#FFFFFF`, text `#18181B`, secondary text `#71717A`, borders `#E8E7E4`
  - **accent `#033FFE`**, soft tint `#E6ECFF`, deep accent for text `#0232D4`
  - status: green `#15803D` on `#E7F6EC`, amber `#B45309` on `#FEF3C7`
- All of these are tokens in `app/globals.css` (`--color-*`). Use the tokens, not new hex values.
- Light theme only, Geist, large tight editorial headlines, white rounded cards, soft shadows.
- Brand: the name is **oneth**, lowercase in running text, always through the `<Brand />` component. The logo (`Wordmark`) and the icon (`BrandMark`, `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png`) are copied unchanged from the app (`frontend/src/components/BrandMark.tsx`, `frontend/public/`). Don't redraw them.

## Content rules (strict)
- No em dashes or en dashes anywhere in copy.
- No hype. Never write "AI magic", "revolutionary" or "replace your accountants".
- No testimonials, no time-saving statistics, no certifications or security claims.
- "Data stays in the UAE" is a commitment, not a certification.
- Zoho Books, Xero and TallyPrime are text labels only. No logos.
- All companies, people and TRNs in `lib/demo-data.ts` are fictional. Keep it that way: no real brands.
- Match what the product does: it never writes back to an accounting system (shadow mode), so never say an entry is posted to Zoho Books, Xero or TallyPrime; and a person always sends requests to clients (DECISIONS.md R7).
- Amounts and VAT (5%) are derived in code so every scene agrees. The featured invoice is INV-2026-0418, AED 3,550.00 + 177.50 VAT = 3,727.50.

## Architecture
- `app/page.tsx` sets the section order: Navbar, Hero, DocumentWorkflow, Reconciliation, ApprovalWorkflow, DecisionPaper, ApprovalLimits, Features, Outlook, PilotForm, Footer, MobileTabBar, ScrollManager.
- This app's root is `landing/` (its own package.json, config and docs). The "Sign in" links go to the app at `NEXT_PUBLIC_APP_URL` + `/login` (`lib/app-url.ts`): in development they default to http://localhost:5173, and a production build without the variable hides them.
- `lib/animations.ts` holds every scroll timeline, one function per section. Each uses `gsap.matchMedia()` with three modes:
  - **desktop** (>=1024px with motion): pinned, scrubbed, reversible timelines
  - **mobile** (<1024px with motion): the phone-specific scenes
  - **reduced motion**: nothing animates
- Rule: markup is always rendered in its finished state, and timelines animate from earlier states. Reduced-motion and no-JS visitors must still see the complete story. Keep this rule.
- Pinned desktop scenes are drawn on a fixed design canvas (`components/Stage.tsx`, 1200 x 600) that scales to fit. Positions are measured with `offsetWithin()`, which ignores transforms.
- The hero's load-in is pure CSS (`.word-mask`, `.anim-rise`, `.hero-dash-enter`). The dashboard's starting tilt lives in CSS (`.hero-dash`), and GSAP takes over from the same values.
- The form posts to `app/api/apply/route.ts`, with validation shared through `lib/validation.ts`.
  - Storage: Supabase if `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, otherwise `SUBMISSION_ENDPOINT`.
  - With neither set it runs in **development mode**: nothing is saved and the page says so. See `.env.example` and the SQL in `README.md`.

## Phones and tablets (<1024px)
- **Navigation:** no top menu. The header is just the logo. `components/MobileTabBar.tsx` is an app-style glass bottom bar (Home, How it works, Features, Waitlist) with a round blue Apply button. The active tab is measured from section positions on scroll. The bar hides while a form field is focused.
- **Prepare, "Scan to ledger"** (`DocumentWorkflow.tsx` MobileScene plus the docs mobile branch in `animations.ts`): the section pins while a scan line sweeps down the invoice. Each field lifts off as a chip into its ledger slot, the "x of 5 fields read" counter rises, and a "Ready for review" stamp lands.
- **Reconciliation, "Zip the books":** bank lines and documents slide in from opposite sides and join. The "Unreconciled" amount counts down from 32,623.65 to 7,399.00, and the exceptions drop into a "Needs you" tray. Scrubbed, not pinned.
- **Review, "Hold to approve":** evidence chips you can tap, and a press-and-hold button with a filling ring. It runs a one-time auto demo, then says "Your turn". This is React state, not GSAP.
- **Features, "A month, cleared"** (phones under 640px only): one client's November to-do list. Rows tick from To do to Prepared as you scroll. Tablets and desktop show the 6-card grid instead.

## How it decides, and earned autonomy (added 2026-11-16)
Taken from the product brief. The stance is "earns its autonomy": in the pilot the team approves everything, then partners choose what it may do alone, and it never files a tax return. The app already has the permission matrix (Settings, partners only, DECISIONS.md R10), so the grid's footnote reads "Example limits for illustration. Partners set them in oneth's settings, and a change applies to the next decision." In shadow mode the app still stores even automatic decisions as proposals (R1).
- **How it decides** (`DecisionPaper.tsx`, `decisionAnimation`): the decision on INV-2026-0418 written up as a working paper (issue, evidence, figures, UAE rule with date, firm policy, precedent, proposal, confidence, action). Black tick marks are checks done by code, blue ones are judgement calls. Desktop pins for 200%; phones show a tick-mark key, then the paper writes itself in as it scrolls (no pin).
- **You set the limits** (`ApprovalLimits.tsx`, `limitsAnimation`): an approval-limits grid (kinds of work by AED amount band). Pilot month, every cell is "Your team"; Month 2 and Month 3 hand routine, low-value cells to oneth. "Request a missing receipt" never moves, because a person always sends requests to clients (R7). The three amount bands and the Partner tier are illustrative: the app has one mode and one AED threshold per action. Data is `approvalLimits` in `lib/demo-data.ts`. Desktop pins for 220%; on phones the month stepper sticks to the top while the grid scrolls under it.
- **Where this goes** (`Outlook.tsx`): one line before the form about a live view of each client's cash flow, margins and obligations, framed as something the firm offers.
- Left out on purpose: pricing (unvalidated), two-step login and audit-record security claims, "time saved", the build roadmap, lender data sharing, Corporate Tax and e-invoicing cards.

## How I like to work
- When I share a reference (a site or a recording), take the idea and come up with **original variations**. Do not copy its layout or patterns. Show me options and let me pick before building big design changes.
- Do not guess. If you are unsure what something looks like, run it and look (screenshots at 390, 768 and 1440 wide), then tell me what you actually checked and what you did not.
- Give me local files. No hosted artifacts or docs.

## Open items and not yet verified
- Not tested on a real iPhone or Android. Check the pinned "Scan to ledger" scene in mobile Safari, and whether press-and-hold feels natural.
- The blue palette was rechecked on every section at 390 and 1440 on 2026-11-16. No violet is left.
- Rebranded to oneth (name, logo, icon) on 2026-11-17 and rechecked at 390, 768 and 1440. The copy no longer says entries are posted to Zoho Books.
- Known, not yet fixed: on phones the "Ready for review" stamp starts at scale 1.8 and makes the page 393px wide until Prepare finishes (`lib/animations.ts`, docs mobile branch). The pilot section's glow starts with a hard top edge (`PilotForm.tsx`, gradient centred at 0%), right under the Outlook line.
- Dev server: something else on this machine uses port 3000, so run `npx next dev -p 3100`. `next dev` also writes `AGENTS.md`, which `.gitignore` ignores.
- No backend is connected yet, so submissions are not saved until `.env.local` is filled in.
- Not deployed anywhere. There's no Open Graph image or analytics yet.

Start by running the project, opening it at 390 and 1440 widths, and telling me what you see. Then wait for my next instruction.
