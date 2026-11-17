# oneth landing page (oneth.ai)

Pre-launch landing page for oneth, an AI operations platform for UAE accounting and bookkeeping firms.
It is built for pilot applications and waitlist signups. It lives in `landing/` of the oneth repo, as its own app
next to the firm's app (`../frontend`) and the API (`../backend`).

Stack: Next.js 16 (App Router), TypeScript, Tailwind CSS 4, GSAP 3 with ScrollTrigger and MotionPathPlugin (`@gsap/react`), and Geist via `next/font`.
There is no Three.js, no scroll-smoothing library and no video. Every animation is built from HTML, SVG and GSAP timelines.

## Run it

```bash
cd landing
npm install
npm run dev          # http://localhost:3000 (npx next dev -p 3100 if 3000 is taken)
```

Production:

```bash
npm run build
npm run start
```

Checks:

```bash
npm run typecheck
npm run lint
```

Requires Node 20 or newer (built and tested on Node 24).

## Brand and the app

- The name is **oneth**, lowercase in running text, through `components/Brand.tsx`. The logo (`Wordmark`) and the icon
  (`BrandMark`, `app/icon.svg`, `app/favicon.ico`, `app/apple-icon.png`, `public/oneth-icon.svg`) are copied unchanged from
  the app (`../frontend/src/components/BrandMark.tsx`, `../frontend/public/`).
- Colours are the palette the app is adopting (`../docs/DECISIONS.md`, D41): blue `#033FFE` on `#F8F7F4`.
- The product scenes are drawn from the app's own screens (`../docs/DECISIONS.md`, L2) with the building blocks in
  `components/app/ui.tsx` and Inter, so the page shows what the product really does. Their wording comes from the app and
  the backend (checklist items, request titles, status chips); keep it in step when the app changes.
- "Sign in" links go to the app's `/login` at `NEXT_PUBLIC_APP_URL` (see `lib/app-url.ts` and `.env.example`). In
  development they default to http://localhost:5173; a production build without the variable hides them.

## Form submissions

`POST /api/apply` handles both the pilot application and the waitlist. It validates input on the server (`lib/validation.ts`, shared with the browser) and then stores it in the first backend it finds configured:

1. **Supabase**: set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Inserts go through the REST API from the server only.
2. **Any JSON endpoint**: set `SUBMISSION_ENDPOINT` (and optionally `SUBMISSION_ENDPOINT_TOKEN`, sent as a bearer token).
3. **Nothing set: development mode.** The form still validates and responds, but nothing is stored. The success screen shows a yellow **Development mode: not saved** notice, so no one mistakes it for a real signup.

Copy `.env.example` to `.env.local` and fill in one option.

Supabase tables (the default names can be changed with `SUPABASE_PILOT_TABLE` and `SUPABASE_WAITLIST_TABLE`):

```sql
create table public.pilot_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  firm_name text not null,
  firm_size text not null,
  phone text not null,
  source text
);

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  firm_name text,
  source text
);

-- Only the server (service role) writes. Nobody can read through the public API.
alter table public.pilot_applications enable row level security;
alter table public.waitlist enable row level security;
```

The form includes a hidden honeypot field. Before launch, also add rate limiting at the edge (for example Vercel Firewall or Cloudflare).

## Project structure

```
app/
  layout.tsx            fonts, metadata
  page.tsx              section order
  globals.css           design tokens, CSS entrance animations, hero starting pose
  api/apply/route.ts    submission endpoint
components/
  Navbar.tsx            hides on scroll down, returns on scroll up
  Hero.tsx              word-by-word headline; the clickable app rises and fills the screen
  AccountingDashboard.tsx  the app's Overview: the desktop grid (first screen of hero-app) + compact mobile card
  hero-app/HeroApp.tsx  the hero's clickable app (desktop): the rail and Overview links switch screens
  hero-app/screens.tsx  Clients, Work, Decisions, Period close, Knowledge, Performance, Settings
  hero-app/Guide.tsx    the guided work: invite, one lit click at a time, Skip/Continue/Start over
  hero-app/DecisionScreen.tsx  a decision (invoice, card payment with the client, two-bill match)
  hero-app/ClientPhone.tsx, Toasts.tsx  the client answering; confirmations and oneth's new proposal
  hero-app/useStory.ts, usePageHold.ts, useHeroSignals.ts, spotlight.ts  story actions, page hold, scroll signals, geometry
  lib/hero-story.ts     the story's state, reducer and the counts every screen shows
  DocumentWorkflow.tsx  Prepare: invoice -> the app's Document card and decision record
  Reconciliation.tsx    Reconcile: the app's Bank lines and Ledger items cards, Needs your review panel
  ApprovalWorkflow.tsx  Review: the app's Decision screen; its decision record writes itself in, a cursor approves
  KnowledgeScene.tsx    Knowledge: a precedent is saved (Precedents tab), then the next bill cites it
  PortalScene.tsx       Client portal: the client answers and sends a photo; the firm's Communications tab updates
  app/ui.tsx            the app's building blocks (rail, top bar, cards, chips, rows, pills) for the mockups
  Features.tsx          six feature cards, supported tools, UAE data commitment
  Outlook.tsx           one line on where the product is going, just before the form
  PilotForm.tsx         pilot application + waitlist tabs
  Documents.tsx         invoice, receipt, statement and PDF mockups
  Stage.tsx             fixed-size design canvas scaled to fit (used by pinned scenes)
  Brand.tsx             the oneth name, wordmark and icon (shared with the app)
lib/
  animations.ts         every scroll timeline, one function per section
  app-url.ts            where the "Sign in" links point
  demo-data.ts          fictional companies; amounts and VAT derived in code
  validation.ts         shared client and server validation
```

## How the motion works

- **Markup is always the final, readable state.** Timelines animate from earlier states, so visitors with reduced motion or without JavaScript still see the whole story.
- `gsap.matchMedia()` in each section has three modes:
  - **Desktop with motion** (`min-width: 1024px`): pinned, scrubbed timelines (`scrub: 1`), fully reversible.
  - **Mobile and tablet:** no pinning, simpler fade-up reveals, compact UI.
  - **Reduced motion:** no scroll animation. The desktop scenes are shown as static final frames with connectors drawn.
- The hero's load-in (staggered words, navbar, dashboard rise) is pure CSS, so it never waits on hydration. The dashboard's starting tilt is defined in CSS, and GSAP picks it up from exactly the same values.
- Pinned scenes are laid out on a fixed 1200 x 600 canvas (`Stage`) and scaled to fit. Connector paths are measured with layout offsets, which ignore transforms, and recalculated on every ScrollTrigger refresh.
- Only `transform`, `opacity` and SVG stroke offsets are animated. Scrolling stays native, with no scroll hijacking.

## Content rules followed

- No em dashes in copy, no hype phrases, no testimonials, no time-saving statistics.
- Integrations (Zoho Books, Xero, TallyPrime) are shown as text labels only.
- "Data stays in the UAE" is presented as a commitment, with no certifications claimed.
- All companies, people and TRNs in the demo are fictional.
