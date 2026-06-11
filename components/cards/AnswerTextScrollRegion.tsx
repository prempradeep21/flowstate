"use client";

import { useLayoutEffect, useRef, type ReactNode, type WheelEvent } from "react";
import { CANVAS_NODE_INTERACTIVE_ATTR } from "@/lib/canvasNodeInteraction";
import { QA_ANSWER_HEIGHT_PX } from "@/lib/qaStreamDisplay";

function handleAnswerWheel(e: WheelEvent<HTMLDivElement>) {
  if (!e.currentTarget.closest(`[${CANVAS_NODE_INTERACTIVE_ATTR}]`)) return;
  e.stopPropagation();
  if (e.deltaX !== 0) e.preventDefault();
}

interface AnswerTextScrollRegionProps {
  /** Resets user-scroll tracking when the turn changes. */
  contentKey: string;
  children: ReactNode;
  className?: string;
}

/**
 * Answer text viewport capped at {@link QA_ANSWER_HEIGHT_PX}. Shrinks with short
 * answers; scrolls only when content exceeds the cap.
 */
export function AnswerTextScrollRegion({
  contentKey,
  children,
  className = "",
}: AnswerTextScrollRegionProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const userScrolledRef = useRef(false);
  const contentKeyRef = useRef(contentKey);

  if (contentKeyRef.current !== contentKey) {
    contentKeyRef.current = contentKey;
    userScrolledRef.current = false;
  }

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || userScrolledRef.current) return;
    el.scrollTop = 0;
  });

  return (
    <div
      ref={scrollRef}
      data-answer-scroll
      onWheel={handleAnswerWheel}
      className={`min-w-0 overflow-y-auto overscroll-y-contain ${className}`}
      style={{ maxHeight: QA_ANSWER_HEIGHT_PX }}
      onScroll={() => {
        const el = scrollRef.current;
        if (!el) return;
        if (el.scrollTop > 0) userScrolledRef.current = true;
      }}
    >
      {children}
    </div>
  );
}
