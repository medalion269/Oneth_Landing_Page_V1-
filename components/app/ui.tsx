/**
 * The oneth app's building blocks, recreated for the landing page's product mockups.
 *
 * They follow frontend/src/components (IconRail, TopBar, Card, ListRow, Chip, StatTile, ConfidenceBar, PillButton)
 * and docs/DESIGN.md: Inter at 400 and 600, 24px cards with 24px padding, 14px tiles, pill buttons and chips, lucide
 * icons at 18px and stroke 1.75. Colours are the D41 palette the app is moving to. By default these are static
 * pictures of the app. The hero's clickable app passes handlers (onNavigate, onOpen, onClick, onSelect), and only then
 * do the pieces become buttons. Nothing here links or fetches, and the landing page builds without the app's code.
 */
import type { CSSProperties, ReactNode } from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Building2,
  CalendarCheck,
  ChartLine,
  LayoutGrid,
  ListChecks,
  Scale,
  Search,
  Settings,
  type LucideIcon,
} from "lucide-react";

export const ICON = { size: 18, strokeWidth: 1.75 } as const;
export const ICON_SM = { size: 14, strokeWidth: 1.75 } as const;

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

/* ------------------------------------------------------------------ */
/* Frame: icon rail + top bar                                          */
/* ------------------------------------------------------------------ */

export type RailSection = "overview" | "clients" | "work" | "decisions" | "close" | "knowledge" | "performance" | "settings";

const RAIL: { id: RailSection; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "clients", label: "Clients", icon: Building2 },
  { id: "work", label: "Work", icon: ListChecks },
  { id: "decisions", label: "Decisions", icon: Scale },
  { id: "close", label: "Period close", icon: CalendarCheck },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "performance", label: "Performance", icon: ChartLine },
  { id: "settings", label: "Settings", icon: Settings },
];

/**
 * The 64px rail: the oneth icon, then circular icon buttons; the active one is a filled ink circle. With `onNavigate`
 * the icons are real buttons, each with its label on hover.
 */
export function AppRail({ active, badge, onNavigate }: { active: RailSection; badge?: number; onNavigate?: (id: RailSection) => void }) {
  return (
    <nav
      aria-hidden={onNavigate ? undefined : true}
      aria-label={onNavigate ? "App sections" : undefined}
      className="relative z-20 flex w-16 shrink-0 flex-col items-center gap-2 py-6"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- the app's own icon file */}
      <img src="/oneth-icon.svg" alt="" className="mb-3 size-10" />
      {RAIL.map(({ id, label, icon: Icon }) => {
        const current = id === active;
        const look = cx(
          "relative inline-flex size-11 items-center justify-center rounded-full",
          current ? "bg-ink text-white" : "text-muted",
        );
        const content = (
          <>
            <Icon {...ICON} />
            {id === "decisions" && badge ? (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[12px] font-semibold leading-none text-white ring-2 ring-canvas tabular-nums">
                {badge}
              </span>
            ) : null}
          </>
        );
        if (!onNavigate) {
          return (
            <span key={id} className={look}>
              {content}
            </span>
          );
        }
        return (
          <button
            key={id}
            type="button"
            aria-label={label}
            aria-current={current ? "page" : undefined}
            data-rail={id}
            onClick={() => onNavigate(id)}
            className={cx(
              look,
              "group/rail cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
              !current && "hover:bg-line hover:text-ink",
            )}
          >
            {content}
            <span
              aria-hidden
              className="pointer-events-none absolute left-full top-1/2 ml-3 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-[12px] font-semibold leading-[16px] text-white opacity-0 shadow-app transition-opacity group-hover/rail:opacity-100 group-focus-visible/rail:opacity-100"
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

/** Page title on the left; search pill, the blue "Shadow mode" pill, bell and avatar on the right. */
export function AppTopBar({
  title,
  initials = "SM",
  compact = false,
  aside,
}: {
  title: ReactNode;
  initials?: string;
  compact?: boolean;
  /** Shown beside the title (the hero app's "click around" note). */
  aside?: ReactNode;
}) {
  return (
    <header className={cx("flex items-center justify-between gap-4", compact ? "py-4" : "py-6")}>
      <div className="flex min-w-0 items-center gap-4">
        <p className={cx("shrink-0 truncate font-semibold text-ink", compact ? "text-[22px] leading-[28px]" : "text-[28px] leading-[36px] tracking-[-0.01em]")}>{title}</p>
        {aside}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!compact && (
          <span className="flex h-10 w-72 items-center gap-2 rounded-full bg-paper px-4 text-[14px] text-faint shadow-app">
            <Search {...ICON} className="shrink-0" />
            Search clients and documents
          </span>
        )}
        <ShadowModePill />
        {!compact && (
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-paper text-ink shadow-app">
            <Bell {...ICON} />
          </span>
        )}
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-ink text-[13px] font-semibold text-white">{initials}</span>
      </div>
    </header>
  );
}

/** oneth runs in shadow mode in v1: it proposes every decision, people approve or overturn, nothing is written back. */
export function ShadowModePill() {
  return (
    <span className="inline-flex h-10 items-center gap-2 rounded-full bg-accent-soft px-4 text-[13px] font-semibold text-accent-ink">
      <span className="size-2 rounded-full bg-accent" />
      Shadow mode
    </span>
  );
}

/** The app's page: Inter on the soft page colour, rail on the left, top bar and content on the right. */
export function AppFrame({
  section,
  title,
  badge,
  children,
  className = "",
  frameProps,
  onNavigate,
  hint,
  overlay,
}: {
  section: RailSection;
  title: ReactNode;
  badge?: number;
  children: ReactNode;
  className?: string;
  frameProps?: Record<string, unknown>;
  /** Makes the rail clickable (the hero's app). */
  onNavigate?: (id: RailSection) => void;
  /** A note beside the page title, e.g. to say the app can be clicked. */
  hint?: ReactNode;
  /** Drawn over the whole frame (toasts, the guide); the frame is its positioning box. */
  overlay?: ReactNode;
}) {
  return (
    <div {...frameProps} className={cx("relative flex h-full w-full overflow-clip bg-canvas font-app text-ink antialiased", className)}>
      <AppRail active={section} badge={badge} onNavigate={onNavigate} />
      <div className="flex min-w-0 flex-1 flex-col px-6 pb-6">
        <AppTopBar title={title} aside={hint} />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
      {overlay}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cards, rows, chips                                                  */
/* ------------------------------------------------------------------ */

/** White 24px card with 24px padding: title top-left, the circular open button top-right. */
export function AppCard({
  title,
  open = false,
  onOpen,
  openLabel = "Open",
  wash = false,
  action,
  className = "",
  children,
  ...rest
}: {
  title?: ReactNode;
  open?: boolean;
  /** Makes the open button a real button. */
  onOpen?: () => void;
  openLabel?: string;
  wash?: boolean;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
} & Record<`data-${string}`, unknown>) {
  open = open || !!onOpen;
  return (
    <section
      {...rest}
      className={cx(
        "flex min-w-0 flex-col gap-4 rounded-app-card p-6 shadow-app",
        wash ? "bg-[linear-gradient(135deg,var(--color-accent-soft),var(--color-paper)_70%)]" : "bg-paper",
        className,
      )}
    >
      {(title !== undefined || open || action) && (
        <header className="flex items-center justify-between gap-3">
          {title !== undefined ? <p className="text-[15px] font-semibold leading-[22px] text-ink">{title}</p> : <span />}
          <span className="flex items-center gap-2">
            {action}
            {open &&
              (onOpen ? (
                <button
                  type="button"
                  aria-label={openLabel}
                  title={openLabel}
                  onClick={onOpen}
                  className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-line-soft text-ink outline-none transition-colors hover:bg-line focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <ArrowUpRight {...ICON} />
                </button>
              ) : (
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-line-soft text-ink">
                  <ArrowUpRight {...ICON} />
                </span>
              ))}
          </span>
        </header>
      )}
      {children}
    </section>
  );
}

export type Tone = "done" | "review" | "blocked" | "progress" | "accent" | "neutral";

const CHIP_TONE: Record<Tone, string> = {
  done: "bg-ok-soft text-ok",
  review: "bg-warn-soft text-warn",
  blocked: "bg-blocked-soft text-blocked",
  progress: "bg-accent-soft text-accent-ink",
  accent: "bg-accent-soft text-accent-ink",
  neutral: "bg-line-soft text-muted",
};

/** Soft status chip: pale tint background, darker text of the same hue. */
export function Chip({ tone = "neutral", size = "md", children, className = "" }: { tone?: Tone; size?: "sm" | "md"; children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-semibold tabular-nums",
        size === "sm" ? "px-2 py-0.5 text-[12px] leading-[16px]" : "px-3 py-1 text-[13px] leading-[18px]",
        CHIP_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const CIRCLE_TONE: Record<"default" | "card" | Exclude<Tone, "neutral">, string> = {
  default: "bg-line-soft text-ink",
  card: "bg-paper text-ink",
  accent: "bg-accent-soft text-accent-ink",
  done: "bg-ok-soft text-ok",
  review: "bg-warn-soft text-warn",
  blocked: "bg-blocked-soft text-blocked",
  progress: "bg-accent-soft text-accent-ink",
};

/** 36px circle holding an 18px icon. */
export function IconCircle({ icon: Icon, tone = "default" }: { icon: LucideIcon; tone?: keyof typeof CIRCLE_TONE }) {
  return (
    <span className={cx("inline-flex size-9 shrink-0 items-center justify-center rounded-full", CIRCLE_TONE[tone])}>
      <Icon {...ICON} />
    </span>
  );
}

/** A row on a grey 14px tile: icon circle, title and subtitle, then the amount or status on the right. */
export function ListRow({
  icon,
  iconTone = "card",
  title,
  subtitle,
  right,
  selected = false,
  stacked = false,
  wrap = false,
  iconNode,
  onClick,
  className = "",
  ...rest
}: {
  /** Makes the whole row a button (its right-hand content must then hold no buttons). */
  onClick?: () => void;
  icon?: LucideIcon;
  /** Instead of `icon`: any 18px icon content (e.g. two icons that cross-fade), in the same 36px circle. */
  iconNode?: ReactNode;
  iconTone?: keyof typeof CIRCLE_TONE;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  selected?: boolean;
  /** Narrow screens: the right-hand content moves under the title instead of squeezing it out. */
  stacked?: boolean;
  /** Let the title wrap to as many lines as it needs (stacked rows otherwise clamp it to two). */
  wrap?: boolean;
  className?: string;
} & Record<`data-${string}`, unknown>) {
  const rightSlot = right !== undefined && (
    <span className={cx("flex shrink-0 items-center gap-3 text-[14px] text-ink tabular-nums", stacked && "mt-1.5")}>{right}</span>
  );
  const Root = onClick ? "button" : "div";
  return (
    <Root
      {...rest}
      {...(onClick ? { type: "button" as const, onClick } : {})}
      className={cx(
        "flex w-full min-w-0 gap-3 rounded-app-tile px-4 py-3",
        stacked ? "items-start" : "items-center",
        selected ? "bg-accent-soft" : "bg-line-soft",
        onClick &&
          cx(
            "cursor-pointer text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
            !selected && "hover:bg-line",
          ),
        className,
      )}
    >
      {iconNode ? (
        <span className={cx("inline-flex size-9 shrink-0 items-center justify-center rounded-full", CIRCLE_TONE[iconTone])}>{iconNode}</span>
      ) : (
        icon && <IconCircle icon={icon} tone={iconTone} />
      )}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cx("text-[14px] font-semibold leading-[20px] text-ink", wrap ? "" : stacked ? "line-clamp-2" : "truncate")}>{title}</span>
        {subtitle !== undefined && <span className="truncate text-[13px] leading-[18px] text-muted">{subtitle}</span>}
        {stacked && rightSlot}
      </span>
      {!stacked && rightSlot}
    </Root>
  );
}

/** Small grey label and a big tabular number, on a grey tile or plain. */
export function StatTile({
  label,
  value,
  size = "stat",
  surface = "tile",
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  size?: "stat" | "hero";
  surface?: "tile" | "plain";
  className?: string;
}) {
  return (
    <div className={cx("flex min-w-0 flex-col gap-1", surface === "tile" && "rounded-app-tile bg-line-soft p-4", className)}>
      <span className="text-[13px] leading-[18px] text-muted">{label}</span>
      <span
        className={cx(
          "font-semibold text-ink tabular-nums",
          size === "hero" ? "text-[40px] leading-[48px] tracking-[-0.02em]" : "text-[32px] leading-[40px] tracking-[-0.015em]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/** A small blue bar plus a percentage: oneth's own confidence. */
export function ConfidenceBar({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="block h-1.5 w-16 overflow-hidden rounded-full bg-accent-soft">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      <span className="w-9 text-right text-[12px] font-semibold leading-[16px] text-muted tabular-nums">{Math.round(value * 100)}%</span>
    </span>
  );
}

/** Ink pill (the primary action), or a white/grey secondary pill. */
export function PillButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  style,
  onClick,
  ...rest
}: {
  children: ReactNode;
  variant?: "primary" | "secondary";
  size?: "sm" | "md";
  className?: string;
  /** Inline start state for a timeline (e.g. a button that is only shown while it plays). */
  style?: CSSProperties;
  /** Makes the pill a real button. */
  onClick?: () => void;
} & Record<`data-${string}`, unknown>) {
  const Root = onClick ? "button" : "span";
  return (
    <Root
      {...rest}
      {...(onClick ? { type: "button" as const, onClick } : {})}
      style={style}
      className={cx(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold",
        size === "sm" ? "h-8 px-4 text-[13px]" : "h-10 px-5 text-[14px]",
        variant === "primary" ? "bg-ink text-white" : "bg-line-soft text-ink",
        onClick &&
          cx(
            "cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
            variant === "primary" ? "hover:bg-ink/85" : "hover:bg-line",
          ),
        className,
      )}
    >
      {children}
    </Root>
  );
}

/** A pill group: the active pill is solid ink, the others plain text. With `onSelect` the pills are buttons. */
export function PillTabs<T extends string>({
  items,
  active,
  onSelect,
  className = "",
}: {
  items: readonly T[];
  active: T;
  onSelect?: (label: T) => void;
  className?: string;
}) {
  return (
    <span className={cx("inline-flex items-center gap-1 rounded-full bg-paper p-1 shadow-app", className)}>
      {items.map((label) => {
        const look = cx(
          "inline-flex h-8 items-center whitespace-nowrap rounded-full px-4 text-[13px] font-semibold",
          label === active ? "bg-ink text-white" : "text-muted",
        );
        return onSelect ? (
          <button
            key={label}
            type="button"
            aria-pressed={label === active}
            onClick={() => onSelect(label)}
            className={cx(
              look,
              "cursor-pointer outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent",
              label !== active && "hover:bg-line-soft hover:text-ink",
            )}
          >
            {label}
          </button>
        ) : (
          <span key={label} className={look}>
            {label}
          </span>
        );
      })}
    </span>
  );
}
