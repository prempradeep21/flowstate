"use client";

import { AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnswerSelectionMenu } from "@/components/AnswerSelectionMenu";
import { QuickExplainPopup } from "@/components/QuickExplainPopup";
import { useAuth, useCanEditCanvas } from "@/components/AuthProvider";
import { useAnswerTextSelection } from "@/hooks/useAnswerTextSelection";
import { findSourceCardIdForArtifact } from "@/lib/artifactSourceCard";
import { computeArtifactSelectionTextLabelPosition } from "@/lib/canvasTextPlacement";
import { createUrlArtifactFromText } from "@/lib/createUrlArtifact";
import { quickExplain, type QuickExplainHandle } from "@/lib/quickExplainClient";
import {
  newExplainId,
  useCanvasStore,
  type AnswerExplain,
} from "@/lib/store";

export function ArtifactTextSelection({
  children,
  artifactId,
  sourceCardId,
  enabled = true,
  className = "",
}: {
  children: ReactNode;
  artifactId: string;
  sourceCardId?: string | null;
  enabled?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canEdit = useCanEditCanvas();
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  // No `s.viewport` subscription — it changes every pan/zoom frame and would
  // re-render this wrapper (and its artifact subtree) per frame.
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const createBranchFromSelection = useCanvasStore(
    (s) => s.createBranchFromSelection,
  );
  const spawnCanvasTextLabel = useCanvasStore((s) => s.spawnCanvasTextLabel);
  const { user, stampContributor } = useAuth();

  const resolvedSourceCardId =
    sourceCardId ?? findSourceCardIdForArtifact(artifactId);

  const { selection, clearSelection } = useAnswerTextSelection({
    containerRef,
    enabled,
  });

  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);
  const [quickExplainBusy, setQuickExplainBusy] = useState(false);
  const [openExplain, setOpenExplain] = useState<AnswerExplain | null>(null);
  const [explainAnchorRect, setExplainAnchorRect] = useState<DOMRect | null>(
    null,
  );
  const explainRunRef = useRef<QuickExplainHandle | null>(null);

  useEffect(() => {
    if (selection) setMenuAnchorRect(selection.rect);
  }, [selection]);

  const startQuickExplain = useCallback(() => {
    if (!selection) return;
    const { selectedText, occurrenceIndex, rect } = selection;
    setMenuAnchorRect(rect);
    setExplainAnchorRect(rect);
    const entry: AnswerExplain = {
      id: newExplainId(),
      selectedText,
      occurrenceIndex,
      explanation: "",
      status: "loading",
    };
    setOpenExplain(entry);
    setQuickExplainBusy(true);
    explainRunRef.current?.cancel();
    explainRunRef.current = quickExplain(selectedText, {
      onToken: (text) =>
        setOpenExplain((prev) =>
          prev ? { ...prev, explanation: text } : prev,
        ),
      onDone: () => {
        setOpenExplain((prev) =>
          prev ? { ...prev, status: "done" } : prev,
        );
        setQuickExplainBusy(false);
      },
      onError: (msg) => {
        setOpenExplain((prev) =>
          prev ? { ...prev, status: "error", explanation: msg } : prev,
        );
        setQuickExplainBusy(false);
      },
    });
    clearSelection();
  }, [selection, clearSelection]);

  const handleQuickExplainFromMenu = useCallback(() => {
    if (!selection || quickExplainBusy) return;
    setQuickExplainBusy(true);
    startQuickExplain();
    window.setTimeout(() => setQuickExplainBusy(false), 400);
  }, [selection, quickExplainBusy, startQuickExplain]);

  const handleAskQuestion = useCallback(() => {
    if (!selection || !canEdit || canvasReadOnly || !resolvedSourceCardId) {
      return;
    }
    recordUndo();
    const branchId = createBranchFromSelection(
      resolvedSourceCardId,
      selection.selectedText,
      "right",
    );
    clearSelection();
    if (user?.id && branchId) stampContributor(user.id, branchId);
  }, [
    selection,
    canEdit,
    canvasReadOnly,
    resolvedSourceCardId,
    recordUndo,
    createBranchFromSelection,
    clearSelection,
    user?.id,
    stampContributor,
  ]);

  const handleAddToCanvas = useCallback(() => {
    if (!selection || !canEdit || canvasReadOnly) return;
    const position = computeArtifactSelectionTextLabelPosition(
      selection.rect,
      useCanvasStore.getState().viewport,
    );
    if (!position) return;
    if (!createUrlArtifactFromText(selection.selectedText, position)) {
      recordUndo();
      spawnCanvasTextLabel(position, selection.selectedText);
    }
    clearSelection();
  }, [
    selection,
    canEdit,
    canvasReadOnly,
    recordUndo,
    spawnCanvasTextLabel,
    clearSelection,
  ]);

  useEffect(() => () => explainRunRef.current?.cancel(), []);

  return (
    <>
      <div
        ref={containerRef}
        data-selectable-text
        className={`min-h-0 flex-1 select-text ${className}`}
      >
        {children}
      </div>
      {(selection || quickExplainBusy) && menuAnchorRect && (
        <AnswerSelectionMenu
          rect={menuAnchorRect}
          onQuickExplain={handleQuickExplainFromMenu}
          onAskQuestion={handleAskQuestion}
          onAddToCanvas={handleAddToCanvas}
          askDisabled={!canEdit || canvasReadOnly || !resolvedSourceCardId}
          addToCanvasDisabled={!canEdit || canvasReadOnly}
          quickExplainLoading={quickExplainBusy}
        />
      )}
      <AnimatePresence>
        {openExplain && explainAnchorRect && (
          <QuickExplainPopup
            key={openExplain.id}
            explain={openExplain}
            anchorRect={explainAnchorRect}
            onClose={() => {
              setOpenExplain(null);
              setQuickExplainBusy(false);
              setExplainAnchorRect(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
