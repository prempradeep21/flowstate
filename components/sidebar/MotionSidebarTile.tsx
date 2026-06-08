"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import {
  sidebarTileEnterVariants,
  sidebarTileExitTransition,
} from "@/lib/motion/variants";
import type { SidebarTileSpan } from "@/lib/artifactSidebarLayout";

export function MotionSidebarTile({
  staggerIndex,
  staggerActive,
  span,
  children,
}: {
  staggerIndex: number;
  staggerActive: boolean;
  span: SidebarTileSpan;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  const shouldAnimateEnter = staggerActive && !reduced;
  const spanClass = span === 2 ? "col-span-2" : "";

  return (
    <m.div
      layout
      initial={
        shouldAnimateEnter ? sidebarTileEnterVariants.initial : false
      }
      animate={
        shouldAnimateEnter
          ? sidebarTileEnterVariants.animate(staggerIndex)
          : sidebarTileEnterVariants.reduced
      }
      exit={
        reduced
          ? { opacity: 0, transition: { duration: 0 } }
          : {
              opacity: 0,
              scale: 0.96,
              transition: sidebarTileExitTransition,
            }
      }
      className={`min-w-0 ${spanClass}`}
    >
      {children}
    </m.div>
  );
}
