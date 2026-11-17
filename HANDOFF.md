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
- `app/page.tsx` sets the section order: Navbar, Hero, DocumentWorkflow, Reconciliation, ApprovalWorkflow, KnowledgeScene, ApprovalLimits, PortalScene, PeriodCloseScene, Features, Outlook, PilotForm, Footer, MobileTabBar, ScrollManager.
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
- **Prepare, "Scan to ledger"** (`DocumentWorkflow.tsx` MobileScene plus the docs mobile branch in `animations.ts`): the section pins while a scan line sweeps down the invoice. Each field lifts off as a chip into its ledger slot, the "x of 5 fields read" counter rises, and the app's "Needs review" chip lands as the stamp.
- **Reconciliation, "Zip the books":** bank lines and documents slide in from opposite sides and join. The "Unreconciled" amount counts down from 32,623.65 to 7,399.00, and the exceptions drop into a "Needs you" tray. Scrubbed, not pinned.
- **Review, "Hold to approve":** the app's Decision record and Actions cards, and a press-and-hold button with a filling ring. It runs a one-time auto demo, then says "Your turn". This is React state, not GSAP.
- **Knowledge, Client portal, Period close:** not pinned. The precedent drops in; the portal fills the screen (no phone inside the phone) and the answer is typed, attached and sent as you scroll; the checklist turns Done row by row before the sign-off lands. Phone timelines never change an element's height, so the page below doesn't move while they play.
- **Features, "A month, cleared"** (phones under 640px only): one client's November to-do list. Rows tick from To do to Prepared as you scroll. Tablets and desktop show the 6-card grid instead.

## The scenes are the app (redesigned 2026-11-17)
The user asked for the page to show how the product really works, keeping the flow and the animations. Every product mockup is now one of the app's own screens, drawn with `components/app/ui.tsx` (rail, top bar with the Shadow mode pill, 24px cards, 14px tiles, chips, pills, Inter 400/600, lucide icons at 18/1.75) in the D41 colours. Data stays fictional (Rahman & Co. Accountants, Saffron Grove Restaurants LLC, Desert Line). See `docs/DECISIONS.md`, L2.
- **Hero:** the app's Overview (Today, Needs you, Daily briefing, Decisions this week, Ready for sign-off, VAT deadlines).
- **Prepare / Reconcile:** the Document card and decision record; Bank lines and Ledger items with the Needs your review panel.
- **Review** (`ApprovalWorkflow.tsx`, `writeRecord`): the Decision screen. The decision record (issue, evidence, context, rule, policy, precedents, proposal, reasoning, confidence) writes itself in, lighting up the invoice, then a cursor approves. The old "working paper" scene (`DecisionPaper.tsx`) is folded in here and deleted.
- **Knowledge** (`KnowledgeScene.tsx`): the approval is saved as a precedent and drops into the Precedents tab; the next Desert Line bill (INV-2026-0441) is proposed citing it.
- **You set the limits** (`ApprovalLimits.tsx`): Settings, Permissions, one mode and one AED limit per action (Off, Propose, Auto, Auto under a threshold). Send routine requests and Post entries stay Propose; Submit tax returns is locked Off. The month stepper keeps the pilot-to-month-3 story.
- **Client portal** (`PortalScene.tsx`): the client's phone shows the portal's Questions tab under the firm's name and colour; the client types an answer, photographs the Bazaar Lane tax invoice and sends. Beside it, the client's Communications tab: the question turns Answered, the reply arrives, then oneth proposes settling the payment against the invoice (`propose_settlement`). The decision itself stays open for a person; there is no "client answered" status in the app.
- **Period close** (`PeriodCloseScene.tsx`): October's checklist with the engine's own wording (`backend/engine/close.py`) turns Done; once nothing is Blocked the period is Ready for sign-off; a partner (Aisha Rahman, AR) signs off through the app's confirm dialog and the month is locked. oneth's depreciation adjustment is shown as proposed.
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
- Redesigned on 2026-11-17 so the scenes are the app (see above) and checked at 390, 768, 1366 x 650 and 1440, with reduced motion too. The phone stamp is now the app's chip, which fixed the page being 393px wide during Prepare.
- Known, not yet fixed: the pilot section's glow starts with a hard top edge (`PilotForm.tsx`, gradient centred at 0%), right under the Outlook line.
- Dev server: something else on this machine uses port 3000, so run `npx next dev -p 3100`. `next dev` also writes `AGENTS.md`, which `.gitignore` ignores.
- No backend is connected yet, so submissions are not saved until `.env.local` is filled in.
- Not deployed anywhere. There's no Open Graph image or analytics yet.

Start by running the project, opening it at 390 and 1440 widths, and telling me what you see. Then wait for my next instruction.
