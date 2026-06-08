"use client";

import { AnimatePresence, m } from "framer-motion";
import type { ReactNode } from "react";
import {
  overlayModalVariants,
  overlayPopoverVariants,
  overlaySlideVariants,
} from "@/lib/motion/variants";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

export function MotionOverlaySlide({
  isOpen,
  children,
  className,
  style,
  role,
  "aria-label": ariaLabel,
}: {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  role?: string;
  "aria-label"?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <m.aside
          key="overlay-slide"
          role={role}
          aria-label={ariaLabel}
          initial={reducedMotion ? "reducedEnter" : "initial"}
          animate={reducedMotion ? "reducedEnter" : "animate"}
          exit="exit"
          variants={overlaySlideVariants}
          className={className}
          style={style}
        >
          {children}
        </m.aside>
      )}
    </AnimatePresence>
  );
}

export function MotionOverlayModal({
  isOpen,
  children,
  className,
}: {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          key="overlay-modal"
          initial={reducedMotion ? { opacity: 1, scale: 1 } : "initial"}
          animate={reducedMotion ? { opacity: 1, scale: 1 } : "animate"}
          exit="exit"
          variants={overlayModalVariants}
          className={className}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}

export function MotionOverlayPopover({
  isOpen,
  children,
  className,
  style,
}: {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          key="overlay-popover"
          initial={reducedMotion ? { opacity: 1, y: 0 } : "initial"}
          animate={reducedMotion ? { opacity: 1, y: 0 } : "animate"}
          exit="exit"
          variants={overlayPopoverVariants}
          className={className}
          style={style}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}

export function MotionBackdrop({
  isOpen,
  onClick,
  className,
}: {
  isOpen: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <m.button
          key="backdrop"
          type="button"
          aria-label="Close"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={className}
          onClick={onClick}
        />
      )}
    </AnimatePresence>
  );
}
