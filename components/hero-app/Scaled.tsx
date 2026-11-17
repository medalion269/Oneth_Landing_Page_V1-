"use client";

/**
 * Draws its children at a fixed natural size (an A4 page, a phone screen) and scales them to the box it is given, so
 * the picture keeps real proportions and type sizes at any window size. "width" fits the box's width (the height
 * follows); "contain" fits inside the box and centres.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

export function Scaled({
  width,
  height,
  fit = "width",
  className = "",
  children,
}: {
  width: number;
  height: number;
  fit?: "width" | "contain";
  className?: string;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const s = size ? (fit === "contain" ? Math.min(size.w / width, size.h / height) : size.w / width) : 0;
  const left = size && fit === "contain" ? (size.w - width * s) / 2 : 0;
  return (
    <div ref={box} className={`relative overflow-hidden ${className}`} style={fit === "width" && size ? { height: height * s } : undefined}>
      <div
        className="absolute top-0 origin-top-left"
        style={{ width, height, left, transform: `scale(${s})`, visibility: size ? "visible" : "hidden" }}
      >
        {children}
      </div>
    </div>
  );
}
