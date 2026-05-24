"use client";

import ReactMarkdown from "react-markdown";
import { MARKDOWN_COMPONENTS } from "@/lib/markdownComponents";
import type { Card } from "@/lib/store";

interface TextCardBodyProps {
  card: Card;
  isStreaming?: boolean;
  clampStyle?: React.CSSProperties;
  plainClamp?: boolean;
}

export function TextCardBody({
  card,
  isStreaming,
  clampStyle,
  plainClamp,
}: TextCardBodyProps) {
  if (!card.answer) return null;

  if (plainClamp) {
    return (
      <div
        data-selectable-text
        className="min-w-0 cursor-text select-text break-words whitespace-pre-wrap text-[15px] leading-relaxed text-canvas-ink"
        style={clampStyle}
      >
        {card.answer}
        {isStreaming && <StreamingCaret />}
      </div>
    );
  }

  return (
    <div
      data-selectable-text
      className="min-w-0 cursor-text text-[15px] leading-relaxed text-canvas-ink"
    >
      <ReactMarkdown components={MARKDOWN_COMPONENTS}>{card.answer}</ReactMarkdown>
      {isStreaming && <StreamingCaret />}
    </div>
  );
}

export function StreamingCaret() {
  return (
    <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-canvas-ink/70 align-middle" />
  );
}
