"use client";

import { AnimatePresence, m } from "framer-motion";
import type { ReactNode } from "react";
import { panelContentVariants } from "@/lib/motion/variants";

export function MotionPanelContent({
  side,
  collapsed,
  collapsedContent,
  expandedContent,
}: {
  side: "left" | "right";
  collapsed: boolean;
  collapsedContent: ReactNode;
  expandedContent: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {collapsed ? (
        <m.div
          key="collapsed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="floating-chrome-padding flex items-center gap-2"
        >
          {collapsedContent}
        </m.div>
      ) : (
        <m.div
          key="expanded"
          initial="enter"
          animate="center"
          exit="exit"
          variants={panelContentVariants}
          custom={side}
          className="flex h-full min-w-0 flex-col"
        >
          {expandedContent}
        </m.div>
      )}
    </AnimatePresence>
  );
}
