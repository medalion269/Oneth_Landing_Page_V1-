"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * A fixed-size design canvas (e.g. 1200 x 600) scaled to fit its container.
 *
 * Everything inside is laid out in design pixels, so scroll timelines can use
 * exact coordinates and offset measurements regardless of viewport size.
 * The scale is a CSS variable on the outer box; transforms on the stage never
 * touch the pinned section itself.
 */
export default function Stage({
  width,
  height,
  maxScale = 1.2,
  className = "",
  label,
  children,
}: {
  width: number;
  height: number;
  maxScale?: number;
  className?: string;
  label: string;
  children: ReactNode;
}) {
  const outer = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight || window.innerHeight * 0.7;
      const s = Math.max(0.3, Math.min(w / width, h / height, maxScale));
      el.style.setProperty("--s", s.toFixed(4));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height, maxScale]);

  return (
    <div ref={outer} className={`relative h-full w-full ${className}`}>
      <div
        data-stage
        role="img"
        aria-label={label}
        className="absolute left-1/2 top-1/2"
        style={{
          width,
          height,
          transform: "translate(-50%, -50%) scale(var(--s, 0.85))",
          transformOrigin: "50% 50%",
        }}
      >
        {children}
      </div>
    </div>
  );
}
