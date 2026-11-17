"use client";

import { useRef } from "react";
import Brand from "./Brand";
import { outlookAnimation, useGSAP } from "@/lib/animations";

/** One quiet line on where the product is going, framed as something the firm offers its clients. */
export default function Outlook() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (!root.current) return;
      const mm = outlookAnimation(root.current);
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} aria-labelledby="outlook-title" className="relative pt-2 sm:pt-4">
      <div className="container-x">
        <div data-reveal className="border-t border-line pt-10 sm:pt-14 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
          <p id="outlook-title" className="eyebrow lg:pt-2">
            Where this goes
          </p>
          <p className="mt-3 max-w-4xl text-pretty text-[clamp(1.3rem,2.3vw,1.95rem)] font-medium leading-[1.3] tracking-[-0.025em] lg:mt-0">
            Today, <Brand /> prepares the books.{" "}
            <span className="text-muted">
              Next, the same records give your firm a live view of each client&apos;s cash flow, margins and upcoming obligations, so you can advise sooner.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
