"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  applyExplainHighlights,
  cleanupLegacyExplainMarks,
  clearExplainHighlights,
  findExplainAtPoint,
  getExplainOverlayBoxes,
} from "@/lib/answerTextRange";
import { MARKDOWN_COMPONENTS } from "@/lib/markdownComponents";
import type { AnswerExplain, Card } from "@/lib/store";

interface TextCardBodyProps {
  card: Card;
  isStreaming?: boolean;
  clampStyle?: React.CSSProperties;
  plainClamp?: boolean;
  answerExplains?: AnswerExplain[];
  textRootRef?: React.RefObject<HTMLDivElement | null>;
  onExplainClick?: (explainId: string) => void;
}

function ExplainOverlays({
  explains,
  container,
  contentKey,
  onExplainClick,
}: {
  explains: AnswerExplain[];
  container: HTMLElement;
  contentKey: string;
  onExplainClick?: (explainId: string) => void;
}) {
  const [boxes, setBoxes] = useState<
    { id: string; boxes: ReturnType<typeof getExplainOverlayBoxes> }[]
  >([]);

  useLayoutEffect(() => {
    setBoxes(
      explains.map((explain) => ({
        id: explain.id,
        boxes: getExplainOverlayBoxes(container, explain),
      })),
    );
  }, [explains, container, contentKey]);

  return (
    <>
      {boxes.map(({ id, boxes: rects }) =>
        rects.map((box, i) => (
          <button
            key={`${id}-${i}`}
            type="button"
            aria-label="Open quick explain"
            data-explain-overlay
            className="absolute cursor-pointer rounded-canvas-xs border-0 bg-canvas-accent/20 p-0"
            style={{
              left: box.left,
              top: box.top,
              width: box.width,
              height: box.height,
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onExplainClick?.(id);
            }}
          />
        )),
      )}
    </>
  );
}

export function TextCardBody({
  card,
  isStreaming,
  clampStyle,
  plainClamp,
  answerExplains,
  textRootRef,
  onExplainClick,
}: TextCardBodyProps) {
  const internalRef = useRef<HTMLDivElement | null>(null);
  const [useOverlayFallback, setUseOverlayFallback] = useState(false);
  const [answerRevealed, setAnswerRevealed] = useState(false);

  const setRef = (node: HTMLDivElement | null) => {
    internalRef.current = node;
    if (textRootRef) {
      (textRootRef as React.MutableRefObject<HTMLDivElement | null>).current =
        node;
    }
  };

  useLayoutEffect(() => {
    const el = internalRef.current;
    if (!el) return;

    cleanupLegacyExplainMarks(el);

    if (!answerExplains?.length || isStreaming) {
      clearExplainHighlights();
      setUseOverlayFallback(false);
      return;
    }

    const applied = applyExplainHighlights(el, answerExplains);
    setUseOverlayFallback(!applied);
  }, [card.answer, answerExplains, isStreaming]);

  useEffect(() => {
    return () => clearExplainHighlights();
  }, []);

  useEffect(() => {
    const el = internalRef.current;
    if (!el || !onExplainClick || !answerExplains?.length) return;
    const onClick = (e: MouseEvent) => {
      const id = findExplainAtPoint(
        el,
        e.clientX,
        e.clientY,
        answerExplains,
      );
      if (id) {
        e.preventDefault();
        e.stopPropagation();
        onExplainClick(id);
      }
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, [onExplainClick, answerExplains]);

  useEffect(() => {
    if (card.answer) setAnswerRevealed(true);
  }, [card.answer]);

  if (!card.answer) return null;

  const bodyClass =
    plainClamp
      ? "min-w-0 cursor-text select-text break-words whitespace-pre-wrap text-canvas-body-lg leading-relaxed text-canvas-ink"
      : "min-w-0 cursor-text text-canvas-body-lg leading-relaxed text-canvas-ink";

  const content = plainClamp ? (
    <>
      {card.answer}
      {isStreaming && <StreamingCaret />}
    </>
  ) : (
    <>
      <ReactMarkdown components={MARKDOWN_COMPONENTS}>{card.answer}</ReactMarkdown>
      {isStreaming && <StreamingCaret />}
    </>
  );

  return (
    <div
      className={`relative min-w-0 ${answerRevealed ? "answer-reveal-in" : ""}`}
    >
      <div
        ref={setRef}
        data-selectable-text
        data-answer-text-root
        className={bodyClass}
        style={clampStyle}
      >
        {content}
      </div>
      {useOverlayFallback &&
        answerExplains?.length &&
        internalRef.current &&
        !isStreaming && (
          <ExplainOverlays
            explains={answerExplains}
            container={internalRef.current}
            contentKey={card.answer}
            onExplainClick={onExplainClick}
          />
        )}
    </div>
  );
}

export function StreamingCaret() {
  return (
    <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-canvas-ink/70 align-middle" />
  );
}
