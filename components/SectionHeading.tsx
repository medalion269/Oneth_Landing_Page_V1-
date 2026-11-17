import type { ReactNode } from "react";

export default function SectionHeading({
  eyebrow,
  title,
  children,
  className = "",
  id,
  pinned = false,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
  id?: string;
  /** Pinned scenes: on large screens keep title and text to one line each, leaving height for the stage. */
  pinned?: boolean;
}) {
  return (
    <div data-heading className={`mx-auto max-w-3xl text-center ${pinned ? "lg:max-w-[72rem]" : ""} ${className}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className={`headline mt-3 text-balance ${pinned ? "lg:mt-2" : ""}`}>
        {title}
      </h2>
      {children && (
        <p
          className={`mx-auto mt-4 max-w-[36rem] text-pretty text-[clamp(1rem,1.2vw,1.125rem)] leading-relaxed text-muted ${pinned ? "lg:mt-3 lg:max-w-[56rem]" : ""}`}
        >
          {children}
        </p>
      )}
    </div>
  );
}
