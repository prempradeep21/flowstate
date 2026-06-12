"use client";

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export function LandingSectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
  tone = "default",
}: {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  tone?: "default" | "soft";
}) {
  const reducedMotion = useReducedMotion();

  return (
    <section
      id={id}
      className={`scroll-mt-[72px] border-b border-canvas-border/60 px-6 py-24 sm:py-32 ${
        tone === "soft" ? "bg-canvas-card/40" : "bg-canvas-bg"
      } ${className}`}
    >
      <m.div
        className="mx-auto max-w-6xl"
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        {eyebrow ? (
          <p className="mb-4 text-canvas-micro font-medium uppercase tracking-[0.16em] text-canvas-accent">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="max-w-[18ch] font-display text-[clamp(2rem,5vw,3.25rem)] font-normal leading-[1.06] tracking-[-0.025em] text-canvas-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-5 max-w-[42rem] text-canvas-body-lg leading-[1.65] text-canvas-muted">
            {description}
          </p>
        ) : null}
        {children ? <div className="mt-14">{children}</div> : null}
      </m.div>
    </section>
  );
}
