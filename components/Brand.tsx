/**
 * The oneth brand, shared with the product app (frontend/src/components/BrandMark.tsx).
 *
 * - `Brand`: the name in running text. The product writes it as plain lowercase "oneth".
 * - `Wordmark`: the logo ("one", a raised "th" and the blue square). The paths are copied
 *   unchanged from the product's Wordmark; letters take the current text colour, the square
 *   is the accent.
 * - `BrandMark`: the oneth icon, the same file as the product's favicon (public/oneth-icon.svg).
 */
export default function Brand({ className = "" }: { className?: string }) {
  return <span className={`whitespace-nowrap ${className}`}>oneth</span>;
}

export function Wordmark({ className = "", title = "oneth" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="525 195 950 290" role="img" aria-label={title} className={`w-auto text-ink ${className}`}>
      <path
        fillRule="evenodd"
        fill="currentColor"
        d="M535 357.5a112.5 109.5 0 1 0 225 0a112.5 109.5 0 1 0-225 0ZM596 357.5a53 57 0 1 0 106 0a53 57 0 1 0-106 0Z"
      />
      <path
        fill="currentColor"
        d="M783 465V262h60v31c19-25 47-38 79-38c46 0 76 30 76 81v129h-60V347c0-27-16-41-40-41c-32 0-55 21-55 51v108Z"
      />
      <path fill="none" stroke="currentColor" strokeWidth="58" d="M1214 362A85 84 0 1 0 1198 410" />
      <rect fill="currentColor" x="1050" y="350" width="193" height="42" />
      <path fill="none" stroke="currentColor" strokeWidth="24" strokeLinejoin="round" d="M1271 207v83q0 13 15 13h15" />
      <rect fill="currentColor" x="1243" y="233" width="57" height="22" />
      <path fill="none" stroke="currentColor" strokeWidth="24" d="M1323 205v110M1323 268c0-20 13-30 32-30c21 0 32 12 32 32v45" />
      <rect className="fill-accent" x="1420" y="271" width="45" height="44" rx="7" />
    </svg>
  );
}

export function BrandMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a tiny static SVG icon; next/image adds nothing here
    <img src="/oneth-icon.svg" alt="" aria-hidden width={size} height={size} className={`shrink-0 ${className}`} />
  );
}
