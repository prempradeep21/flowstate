"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import {
  panelLineEnterVariants,
  type PanelStaggerSlot,
} from "@/lib/motion/variants";

type MotionPanelLineProps = PanelStaggerSlot & {
  staggerActive: boolean;
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
};

export function MotionPanelLine({
  section,
  item,
  staggerActive,
  children,
  className = "",
  as = "div",
}: MotionPanelLineProps) {
  const reduced = useReducedMotion();
  const shouldAnimate = staggerActive && !reduced;
  const Component = as === "li" ? m.li : m.div;

  return (
    <Component
      initial={shouldAnimate ? panelLineEnterVariants.initial : false}
      animate={
        shouldAnimate
          ? panelLineEnterVariants.animate({ section, item })
          : panelLineEnterVariants.reduced
      }
      className={className}
    >
      {children}
    </Component>
  );
}
