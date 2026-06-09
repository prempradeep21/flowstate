"use client";

import { m } from "framer-motion";
import {
  forwardRef,
  type PointerEventHandler,
  type ReactNode,
} from "react";
import { contentSizeTransition } from "@/lib/motion/variants";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";

type MotionFlowSizeTag = "div" | "section" | "ul";

type MotionFlowSizeProps = {
  children: ReactNode;
  className?: string;
  as?: MotionFlowSizeTag;
  role?: string;
  "aria-label"?: string;
  onPointerDown?: PointerEventHandler<HTMLElement>;
};

const motionTags = {
  div: m.div,
  section: m.section,
  ul: m.ul,
} as const;

export const MotionFlowSize = forwardRef<HTMLElement, MotionFlowSizeProps>(
  function MotionFlowSize(
    {
      children,
      className = "",
      as = "div",
      role,
      "aria-label": ariaLabel,
      onPointerDown,
    },
    ref,
  ) {
    const reducedMotion = useReducedMotion();
    const Tag = as;
    const shared = {
      ref: ref as never,
      className,
      role,
      "aria-label": ariaLabel,
      onPointerDown,
    };

    if (reducedMotion) {
      return <Tag {...shared}>{children}</Tag>;
    }

    const MotionTag = motionTags[as];

    return (
      <MotionTag
        {...shared}
        layout
        transition={contentSizeTransition}
      >
        {children}
      </MotionTag>
    );
  },
);
