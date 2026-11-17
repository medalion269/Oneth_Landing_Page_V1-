"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/animations";
import { scrollToId } from "@/lib/scroll";

/**
 * Recalculates scroll positions once fonts and images have settled, then
 * honours a #hash in the URL (pin spacers change where sections sit).
 */
export default function ScrollManager() {
  useEffect(() => {
    let cancelled = false;
    const settle = () => {
      if (cancelled) return;
      ScrollTrigger.refresh();
      const hash = window.location.hash.slice(1);
      if (hash) requestAnimationFrame(() => scrollToId(hash));
    };
    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    fontsReady.then(() => requestAnimationFrame(settle));
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
    };
  }, []);
  return null;
}
