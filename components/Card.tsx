"use client";

import {
  PointerEvent as ReactPointerEvent,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnswerSelectionMenu } from "@/components/AnswerSelectionMenu";
import { CardAnswerBody } from "@/components/cards/CardAnswerBody";
import { CardQuestionText } from "@/components/cards/CardQuestionText";
import { ConversationCardSurface } from "@/components/admin/ConversationCardSurface";
import { ChatComposer } from "@/components/ChatComposer";
import { Plug } from "@/components/plugs/Plug";
import { canvasSidePlugWrapperClass } from "@/lib/canvasPlugChrome";
import { CanvasSharpContent } from "@/components/CanvasSharpContent";
import { CardQaMenu } from "@/components/CardQaMenu";
import { QuestionAttachments } from "@/components/QuestionAttachments";
import { getQuestionAttachedImages } from "@/lib/questionAttachments";
import { AnimatePresence } from "framer-motion";
import { MotionCanvasNode } from "@/components/motion/MotionCanvasNode";
import {
  QaQuestionHeaderRow,
  QaQuestionSection,
  QaTranslucentSurface,
} from "@/components/QaQuestionSection";
import { useAnswerTextSelection } from "@/hooks/useAnswerTextSelection";
import { useCardAsk } from "@/hooks/useCardAsk";
import { useGestureProvisionalMount } from "@/hooks/useGestureProvisionalMount";
import { useLateralBranchesFromCard } from "@/hooks/useLateralBranchesFromCard";
import {
  anchorYRelativeToCard,
  getExplainRangeRect,
} from "@/lib/answerTextRange";
import {
  qaInsetStyle,
} from "@/lib/design/canvasInsets";
import { clearSpawnMetaIfDragging } from "@/lib/canvasDrag";
import {
  subtreeGestureRefs,
  useCanvasNodeDrag,
} from "@/hooks/useCanvasNodeDrag";
import { CANVAS_ACCENT } from "@/lib/design/tokens";
import { createUrlArtifactFromText } from "@/lib/createUrlArtifact";
import { quickExplain, type QuickExplainHandle } from "@/lib/quickExplainClient";
import { QuickExplainPopup } from "@/components/QuickExplainPopup";
import { finalizeCardResponse } from "@/lib/artifactGeneration";
import {
  clearQaTurnTimeout,
  startQaTurnTimeout,
} from "@/lib/qaTurnTimeout";
import { getLatestVersion } from "@/lib/sessionArtifacts";
import { resolveCardAttachedArtifactRefs } from "@/lib/attachedArtifactRefs";
import { playSound, playSoundThrottled } from "@/lib/sounds/engine";
import {
  getLandingCardId,
  pickCanvasLandingInput,
  shouldShowCanvasLanding,
} from "@/lib/canvasLandingState";
import { isOriginCardPinned } from "@/lib/canvasOrigin";
import { getConnectionCardBounds, measureCardSize } from "@/lib/canvasMeasure";
import {
  isCardPending,
  isCardLayoutPending,
  pendingLayoutMinHeight,
} from "@/lib/cardLayoutPolicy";
import {
  DEFAULT_CANVAS_TUNING,
  RESOLVED_CANVAS_TUNING,
} from "@/lib/canvasTuning";
import { getCardBounds } from "@/lib/canvasNodeBounds";
import { MIN_VIEWPORT_SCALE } from "@/lib/zoomDisplay";
import { plugAnchorAt } from "@/lib/plugConnector";
import { computeSelectionTextLabelPosition } from "@/lib/canvasTextPlacement";
import {
  getFamilyRootThreadId,
  isCardInSelectedFamilies,
} from "@/lib/chatThreads";
import {
  CANVAS_CONTENT_INERT_CLASS,
  CANVAS_NODE_INTERACTIVE_ATTR,
} from "@/lib/canvasNodeInteraction";
import {
  AnswerExplain,
  CanvasArtifactNode,
  Card as CardType,
  FollowUpOptions,
  newExplainId,
  useCanvasStore,
} from "@/lib/store";
import { useAuth, useCanEditCanvas } from "@/components/AuthProvider";
import { ContributorAvatarStack } from "@/components/ContributorAvatarStack";
import { QaStatusBadge } from "@/components/QaStatusBadge";
import { useContributorProfiles } from "@/lib/contributorProfiles";
import {
  isQaResponseFinalError,
  isQaTurnInProgress,
  resolveQaStatusLabel,
  shouldShowQaAnswerText,
} from "@/lib/qaStreamDisplay";

interface CardProps {
  card: CardType;
}

/**
 * Long questions cap at 4 lines with internal scroll — see CardQuestionText.
 */

function CardInner({ card }: CardProps) {
  const { user, members, accessInfo, stampContributor, onlineUserIds } = useAuth();
  const canEdit = useCanEditCanvas();
  const collaborationHasEdits = useCanvasStore((s) => s.collaborationHasEdits);
  const contributorProfiles = useContributorProfiles(
    card.contributorIds,
    members,
    accessInfo?.ownerId,
  );
  const showContributors =
    members.length > 1 &&
    collaborationHasEdits &&
    contributorProfiles.length > 0;

  const updateCard = useCanvasStore((s) => s.updateCard);
  const recordUndo = useCanvasStore((s) => s.recordUndo);
  const setCardSize = useCanvasStore((s) => s.setCardSize);
  const createFollowUp = useCanvasStore((s) => s.createFollowUp);
  const createBranchFromSelection = useCanvasStore(
    (s) => s.createBranchFromSelection,
  );
  const spawnCanvasTextLabel = useCanvasStore((s) => s.spawnCanvasTextLabel);
  // Deliberately NO `s.viewport` subscription here: it changes every pan/zoom
  // frame and would re-render every visible card per frame (memo does not
  // guard internal subscriptions). Read it imperatively where needed.
  const collapsedBranchThreadIds = useCanvasStore(
    (s) => s.collapsedBranchThreadIds,
  );
  const isChatCollapsed = useCanvasStore((s) =>
    s.collapsedCardIds.includes(card.id),
  );
  const toggleBranchThreadCollapsed = useCanvasStore(
    (s) => s.toggleBranchThreadCollapsed,
  );
  const lateralBranches = useLateralBranchesFromCard(card.id);
  const addAnswerExplain = useCanvasStore((s) => s.addAnswerExplain);
  const updateAnswerExplain = useCanvasStore((s) => s.updateAnswerExplain);
  const canvasReadOnly = useCanvasStore((s) => s.canvasReadOnly);
  const startPlugDrag = useCanvasStore((s) => s.startPlugDrag);
  const plugDrag = useCanvasStore((s) => s.plugDrag);
  const moveSubtree = useCanvasStore((s) => s.moveSubtree);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const isSelected = useCanvasStore((s) =>
    isCardInSelectedFamilies(s, card.id, s.selectedFamilyRootIds),
  );
  const hasChildren = useCanvasStore((s) =>
    s.connections.some(
      (c) =>
        c.from === card.id &&
        (c.fromSide === "bottom" || c.fromSide == null),
    ),
  );
  // Crossing-only subscription: re-renders when the LOD boolean flips, not
  // on every settled-scale change (the post-zoom "settle storm"). Scalar
  // compensations (border/accent widths) track scale via the --vp-scale CSS
  // custom property written by CanvasViewport — zero React involvement.
  const lodPlaceholder = useCanvasStore(
    (s) => s.viewportSettledScale < MIN_VIEWPORT_SCALE,
  );
  // Mounted mid-gesture (culling reveal during zoom-out): render the cheap
  // placeholder now, hydrate to full content after the gesture settles.
  const provisionalMount = useGestureProvisionalMount();

  const accent = useCanvasStore(
    (s) => s.threads[card.threadId]?.accentColour,
  );
  const isBranchRoot = useCanvasStore(
    (s) =>
      card.parentCardId === null &&
      s.connections.some((c) => c.to === card.id),
  );
  const isLanding = useCanvasStore((s) => {
    if (
      !shouldShowCanvasLanding({
        cards: s.cards,
        cardOrder: s.cardOrder,
        canvasArtifactOrder: s.canvasArtifactOrder,
        canvasAssetOrder: s.canvasAssetOrder,
        canvasGifOrder: s.canvasGifOrder,
        canvas3DOrder: s.canvas3DOrder,
        canvasSkillOrder: s.canvasSkillOrder,
        canvasTextLabelOrder: s.canvasTextLabelOrder,
      })
    ) {
      return false;
    }
    return getLandingCardId(s.cards, s.cardOrder) === card.id;
  });
  const emptyPlaceholder = isBranchRoot ? "Pull a new thread" : "Ask anything";
  const hideForLanding = isLanding;
  const isConversation = card.cardKind === "conversation";
  const plugAccent = accent ?? CANVAS_ACCENT;
  const showBranchPlugs = card.status === "done" && !isConversation;
  const receivePlugsActive =
    (plugDrag?.kind === "artifact" ||
      plugDrag?.kind === "asset" ||
      plugDrag?.kind === "skill") &&
    plugDrag.receiveTargetCardId === card.id;
  const receiveHighlightSide =
    receivePlugsActive &&
    (plugDrag.kind === "artifact" ||
      plugDrag.kind === "asset" ||
      plugDrag.kind === "skill")
      ? plugDrag.hoveredReceiveSide
      : null;

  const originPinned = useCanvasStore((s) =>
    isOriginCardPinned(
      {
        cards: s.cards,
        cardOrder: s.cardOrder,
        canvasArtifactOrder: s.canvasArtifactOrder,
        canvasAssetOrder: s.canvasAssetOrder,
        canvasGifOrder: s.canvasGifOrder,
        canvas3DOrder: s.canvas3DOrder,
        canvasSkillOrder: s.canvasSkillOrder,
        canvasTextLabelOrder: s.canvasTextLabelOrder,
      },
      card.id,
      s.globalOrigin,
    ),
  );
  const tuning = RESOLVED_CANVAS_TUNING;
  const cardWidth = tuning.cardWidth;

  const isDraggable =
    canEdit &&
    !originPinned &&
    (DEFAULT_CANVAS_TUNING.rootCardsOnlyDraggable
      ? card.parentCardId === null
      : true);

  const isEmptyComposer = card.status === "empty" && !isLanding;

  const branchPlugWorld = (side: "left" | "right") => {
    const { w, h } = getConnectionCardBounds(card, tuning);
    const anchor = plugAnchorAt(
      card.position.x,
      card.position.y,
      w,
      h,
      side,
    );
    return { x: anchor.px, y: anchor.py };
  };

  const handleBranchPlugPointerDown =
    (side: "left" | "right") => (e: ReactPointerEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      e.preventDefault();
      startPlugDrag({
        kind: "branch",
        sourceCardId: card.id,
        fromSide: side,
        pointerWorld: branchPlugWorld(side),
        didDrag: false,
      });
    };

  // Imperative drag: pointermoves transform the subtree's DOM once per frame
  // via the gesture layer; moveSubtree commits ONE store write on drop.
  const nodeDrag = useCanvasNodeDrag({
    kind: "card",
    nodeId: card.id,
    commitMove: (targetId, dx, dy) => moveSubtree(targetId, dx, dy),
    resolveRefs: subtreeGestureRefs,
    onDragStart: (targetId) => {
      clearSpawnMetaIfDragging(targetId);
      void playSoundThrottled("card-drag-start");
    },
    onDrop: (didMove) => {
      if (didMove) void playSound("card-drag-drop");
    },
  });

  const cardRef = useRef<HTMLDivElement | null>(null);
  const answerTextRef = useRef<HTMLDivElement | null>(null);
  const explainRunRef = useRef<QuickExplainHandle | null>(null);
  const { restartAsk } = useCardAsk(card.id, card.status === "thinking");
  const [openExplainId, setOpenExplainId] = useState<string | null>(null);
  const [explainAnchorY, setExplainAnchorY] = useState<number | null>(null);
  const [optimisticExplain, setOptimisticExplain] =
    useState<AnswerExplain | null>(null);
  const [quickExplainBusy, setQuickExplainBusy] = useState(false);
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);
  const lastSizeRef = useRef<{ w: number; h: number } | null>(null);
  const prevHasChildrenRef = useRef(hasChildren);

  const hasAnswerText = Boolean(card.answer.trim());
  const selectionEnabled = card.status === "done" && hasAnswerText;

  const { selection, clearSelection } = useAnswerTextSelection({
    containerRef: answerTextRef,
    enabled: selectionEnabled,
  });

  useEffect(() => {
    if (selection) setMenuAnchorRect(selection.rect);
  }, [selection]);

  const findExistingExplain = useCallback(
    (selectedText: string, occurrenceIndex: number) =>
      card.answerExplains?.find(
        (e) =>
          e.selectedText === selectedText &&
          e.occurrenceIndex === occurrenceIndex,
      ),
    [card.answerExplains],
  );

  const setExplainAnchorFromRect = useCallback((rect: DOMRect) => {
    if (!cardRef.current) return;
    setExplainAnchorY(anchorYRelativeToCard(cardRef.current, rect));
  }, []);

  const startQuickExplain = useCallback(
    (selectedText: string, occurrenceIndex: number, anchorRect?: DOMRect) => {
      if (anchorRect) setExplainAnchorFromRect(anchorRect);

      const existing = findExistingExplain(selectedText, occurrenceIndex);
      if (existing && existing.status !== "error") {
        setOpenExplainId(existing.id);
        setQuickExplainBusy(false);
        if (anchorRect && cardRef.current) {
          setExplainAnchorY(anchorYRelativeToCard(cardRef.current, anchorRect));
        }
        clearSelection();
        return;
      }

      const id = existing?.id ?? newExplainId();
      const entry: AnswerExplain = {
        id,
        selectedText,
        occurrenceIndex,
        explanation: "",
        status: "loading",
      };

      setOptimisticExplain(entry);
      setOpenExplainId(id);

      if (!existing) {
        recordUndo();
        addAnswerExplain(card.id, entry);
      } else {
        updateAnswerExplain(card.id, id, {
          status: "loading",
          explanation: "",
        });
      }

      explainRunRef.current?.cancel();
      explainRunRef.current = quickExplain(selectedText, {
        onToken: (text) =>
          updateAnswerExplain(card.id, id, { explanation: text }),
        onDone: () => {
          updateAnswerExplain(card.id, id, { status: "done" });
          setQuickExplainBusy(false);
        },
        onError: (msg) => {
          updateAnswerExplain(card.id, id, {
            status: "error",
            explanation: msg,
          });
          setQuickExplainBusy(false);
        },
      });
    },
    [
      card.id,
      findExistingExplain,
      clearSelection,
      recordUndo,
      addAnswerExplain,
      updateAnswerExplain,
      setExplainAnchorFromRect,
    ],
  );

  const handleQuickExplainFromMenu = useCallback(() => {
    if (!selection || quickExplainBusy) return;
    setMenuAnchorRect(selection.rect);
    setQuickExplainBusy(true);
    startQuickExplain(
      selection.selectedText,
      selection.occurrenceIndex,
      selection.rect,
    );
    clearSelection();
    window.setTimeout(() => setQuickExplainBusy(false), 400);
  }, [selection, quickExplainBusy, startQuickExplain, clearSelection]);

  const handleExplainClick = useCallback((id: string) => {
    const explain =
      card.answerExplains?.find((e) => e.id === id) ??
      (optimisticExplain?.id === id ? optimisticExplain : null);
    if (explain && answerTextRef.current && cardRef.current) {
      const rangeRect = getExplainRangeRect(answerTextRef.current, explain);
      if (rangeRect) {
        setExplainAnchorY(
          anchorYRelativeToCard(cardRef.current, rangeRect),
        );
      }
    }
    setOpenExplainId(id);
  }, [card.answerExplains, optimisticExplain]);

  const recomputeExplainAnchor = useCallback(() => {
    if (!openExplainId || !answerTextRef.current || !cardRef.current) return;
    const explain =
      card.answerExplains?.find((e) => e.id === openExplainId) ??
      (optimisticExplain?.id === openExplainId ? optimisticExplain : null);
    if (!explain) return;
    const rangeRect = getExplainRangeRect(answerTextRef.current, explain);
    if (rangeRect) {
      setExplainAnchorY(anchorYRelativeToCard(cardRef.current, rangeRect));
    }
  }, [openExplainId, card.answerExplains, optimisticExplain]);

  useLayoutEffect(() => {
    recomputeExplainAnchor();
  }, [recomputeExplainAnchor, card.answer, card.answerExplains, optimisticExplain]);

  useEffect(() => {
    if (
      optimisticExplain &&
      card.answerExplains?.some((e) => e.id === optimisticExplain.id)
    ) {
      setOptimisticExplain(null);
    }
  }, [card.answerExplains, optimisticExplain]);

  const handleAskQuestion = useCallback(() => {
    if (!selection || !canEdit || canvasReadOnly) return;
    recordUndo();
    const branchId = createBranchFromSelection(
      card.id,
      selection.selectedText,
      "right",
    );
    clearSelection();
    if (user?.id && branchId) stampContributor(user.id, branchId);
  }, [
    selection,
    canEdit,
    canvasReadOnly,
    recordUndo,
    createBranchFromSelection,
    card.id,
    clearSelection,
    user?.id,
    stampContributor,
  ]);

  const handleAddToCanvas = useCallback(() => {
    if (!selection || !canEdit || canvasReadOnly) return;
    const cardEl = cardRef.current;
    if (!cardEl) return;
    const position = computeSelectionTextLabelPosition(
      cardEl.getBoundingClientRect(),
      selection.rect,
      // Read at call time — a reactive `s.viewport` subscription here
      // re-rendered EVERY visible card on EVERY pan/zoom frame (the
      // viewport object is replaced per frame), defeating the imperative
      // CanvasViewport transform design.
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

  useEffect(() => {
    return () => explainRunRef.current?.cancel();
  }, []);

  // Structural changes that affect card height — NOT answer.length (ResizeObserver handles growth).
  const layoutKey = [
    card.status,
    card.outputArtifactId ?? "",
    card.artifactPayload?.type ?? "",
    hasChildren ? "1" : "0",
    getQuestionAttachedImages(card).length,
    card.images?.length ?? 0,
    card.responseType ?? "text",
    cardWidth,
    isChatCollapsed ? "1" : "0",
    shouldShowQaAnswerText(card) ? "1" : "0",
    String(card.sdkBuildStages?.length ?? 0),
  ].join("|");

  const TEXT_SELECTABLE =
    'textarea, button, input, select, [contenteditable="true"], [data-selectable-text]';

  const turnInProgress = isQaTurnInProgress(card, canvasArtifactNodes);

  useEffect(() => {
    if (!turnInProgress) {
      clearQaTurnTimeout(card.id);
      return;
    }
    startQaTurnTimeout(card.id);
    return () => clearQaTurnTimeout(card.id);
  }, [turnInProgress, card.id]);

  const showStatusBadge =
    turnInProgress || isQaResponseFinalError(card, canvasArtifactNodes);
  const qaStatusLabel = resolveQaStatusLabel(card, canvasArtifactNodes);

  const pendingMinHeight = turnInProgress
    ? pendingLayoutMinHeight(card.size?.h, tuning.fallbackCardHeight)
    : undefined;

  // Lock layout height when a response starts — no collapse during thinking.
  useLayoutEffect(() => {
    if (!isCardLayoutPending(card, canvasArtifactNodes)) return;
    const el = cardRef.current;
    const measured = el
      ? measureCardSize(el, cardWidth).h
      : card.size?.h ?? tuning.fallbackCardHeight;
    const locked = pendingLayoutMinHeight(
      Math.max(card.size?.h ?? 0, measured),
      tuning.fallbackCardHeight,
    );
    if (!card.size || card.size.h < locked) {
      lastSizeRef.current = { w: cardWidth, h: locked };
      setCardSize(card.id, { w: cardWidth, h: locked });
    }
  }, [
    card.status,
    card.id,
    card.size,
    cardWidth,
    setCardSize,
    tuning.fallbackCardHeight,
    canvasArtifactNodes,
    card.artifactPayload,
    card.outputArtifactId,
    card.pendingEmittedArtifacts,
  ]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const update = () => {
      const next = measureCardSize(el, cardWidth);
      const prev = lastSizeRef.current;
      const status = useCanvasStore.getState().cards[card.id]?.status;

      if (isCardPending(status)) {
        if (status === "thinking" && prev && next.h < prev.h) return;
        if (status === "streaming" && prev && next.h < prev.h) return;
        if (status === "thinking" && !prev) {
          next.h = pendingLayoutMinHeight(next.h, tuning.fallbackCardHeight);
        }
      }

      if (prev && prev.w === next.w && prev.h === next.h) return;
      lastSizeRef.current = next;
      setCardSize(card.id, next);
    };
    update();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [card.id, setCardSize, layoutKey, cardWidth, tuning.fallbackCardHeight]);

  // Follow-up composer removal shrinks the card; remeasure and re-snap chain.
  useLayoutEffect(() => {
    if (prevHasChildrenRef.current === hasChildren) return;
    prevHasChildrenRef.current = hasChildren;
    lastSizeRef.current = null;
    const el = cardRef.current;
    if (!el) return;
    const next = measureCardSize(el, cardWidth);
    lastSizeRef.current = next;
    setCardSize(card.id, next);
    if (hasChildren) {
      requestAnimationFrame(() => {
        useCanvasStore.getState().snapFollowUpChildToParent(card.id);
      });
    }
  }, [hasChildren, card.id, setCardSize, cardWidth]);

  useEffect(() => {
    if (card.status !== "done") return;
    if (card.artifactPayload && !card.outputArtifactId) {
      const nodes = useCanvasStore.getState().canvasArtifactNodes;
      const awaitingApproval = Object.values(nodes).some(
        (n) =>
          n.sourceCardId === card.id &&
          n.permissionPreview?.status === "pending",
      );
      if (!awaitingApproval) {
        finalizeCardResponse(card.id, {});
      }
      return;
    }
    if (card.outputArtifactId && !card.outputArtifactVersionId) {
      const art =
        useCanvasStore.getState().sessionArtifacts[card.outputArtifactId];
      const latest = art ? getLatestVersion(art) : undefined;
      if (latest) {
        updateCard(card.id, { outputArtifactVersionId: latest.id });
      }
    }
  }, [
    card.id,
    card.status,
    card.artifactPayload,
    card.outputArtifactId,
    card.outputArtifactVersionId,
    updateCard,
  ]);

  useEffect(() => {
    if (turnInProgress) return;
    if (!card.thinkingLabel && !(card.sdkBuildStages?.length ?? 0)) return;
    updateCard(card.id, {
      thinkingLabel: undefined,
      sdkBuildStages: undefined,
    });
  }, [
    turnInProgress,
    card.id,
    card.thinkingLabel,
    card.sdkBuildStages,
    updateCard,
  ]);

  const submitQuestion = (question: string, options?: FollowUpOptions) => {
    const q = question.trim();
    if (!q || turnInProgress || !canEdit) return;
    if (user?.id) stampContributor(user.id, card.id);
    restartAsk();
    useCanvasStore.getState().submitCardQuestion(card.id, q, options);
  };

  const submitFollowUp = (question: string, options?: FollowUpOptions) => {
    if (!canEdit) return;
    const childId = createFollowUp(card.id, question, options);
    if (user?.id && childId) stampContributor(user.id, childId);
  };

  const handleTryAgain = useCallback(() => {
    if (!canEdit || !card.question.trim()) return;
    const st = useCanvasStore.getState();
    const attachedFromPlug = resolveCardAttachedArtifactRefs(card.id, {
      cards: st.cards,
      artifactPlugConnections: st.artifactPlugConnections,
      canvasArtifactNodes: st.canvasArtifactNodes,
      plugComposerAttachments: st.plugComposerAttachments,
      sessionArtifacts: st.sessionArtifacts,
    });
    const attachedImages = getQuestionAttachedImages(card);
    submitFollowUp(card.question, {
      attachedArtifacts:
        card.attachedArtifacts?.length
          ? card.attachedArtifacts
          : attachedFromPlug.length
            ? attachedFromPlug
            : undefined,
      pendingImages: attachedImages.length > 0 ? attachedImages : undefined,
    });
  }, [canEdit, card, card.id, submitFollowUp]);

  const handleCardPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (useCanvasStore.getState().plugDrag) return;
    const target = e.target as HTMLElement;
    if (target.closest(TEXT_SELECTABLE)) return;
    if (target.closest("[data-plug]")) return;

    e.stopPropagation();

    const st = useCanvasStore.getState();
    const familyRootId = getFamilyRootThreadId(st, card.threadId);
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      const roots = st.selectedFamilyRootIds;
      st.setSelectedFamilyRootIds(
        roots.includes(familyRootId)
          ? roots.filter((id) => id !== familyRootId)
          : [...roots, familyRootId],
      );
      return;
    }

    const inMultiSelection =
      st.selectedFamilyRootIds.includes(familyRootId) &&
      st.selectedFamilyRootIds.length + st.canvasSelection.length > 1;
    if (!inMultiSelection) {
      st.setCanvasSelection({
        familyRootIds: [familyRootId],
        items: [],
      });
    }

    if (!isDraggable) return;

    // moveSubtree would refuse a pinned origin card — don't start a visual
    // drag that could never commit.
    if (isOriginCardPinned(pickCanvasLandingInput(st), card.id, st.globalOrigin)) {
      return;
    }

    e.preventDefault();
    nodeDrag.start(e, {
      // Drag the whole multi-selection when this card's family is part of it.
      moveSelection:
        st.selectedFamilyRootIds.includes(familyRootId) &&
        st.selectedFamilyRootIds.length + st.canvasSelection.length > 1,
    });
  };

  const handleDragPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    nodeDrag.move(e);
  };

  const openExplain = openExplainId
    ? (card.answerExplains?.find((e) => e.id === openExplainId) ??
      (optimisticExplain?.id === openExplainId ? optimisticExplain : null))
    : null;

  const displayAnswerExplains = (() => {
    const stored = card.answerExplains ?? [];
    if (
      optimisticExplain &&
      !stored.some((e) => e.id === optimisticExplain.id)
    ) {
      return [...stored, optimisticExplain];
    }
    return stored.length ? stored : undefined;
  })();

  const contentInteractive = isSelected || isEmptyComposer;

  const handleDragPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    nodeDrag.end(e);
  };

  // Placeholder LOD: below MIN_VIEWPORT_SCALE card text is sub-legible, but
  // every card still paid full markdown/DOM cost — the dominant mount cost
  // when zooming out on large canvases. Render a cheap fixed-size stand-in
  // instead (driven by SETTLED scale so the swap never happens mid-pinch).
  // Nodes that MOUNT mid-gesture (provisionalMount) also stand in, then
  // hydrate after settle — full-subtree mounts never happen while the
  // fingers are moving. Selected cards and open composers keep full DOM
  // (interaction targets).
  if (
    (provisionalMount || lodPlaceholder) &&
    !isSelected &&
    !isEmptyComposer &&
    !hideForLanding
  ) {
    const bounds = getCardBounds(card, RESOLVED_CANVAS_TUNING);
    return (
      <div
        ref={cardRef}
        data-canvas-card={card.id}
        data-card-lod="placeholder"
        onPointerDown={handleCardPointerDown}
        onPointerMove={handleDragPointerMove}
        onPointerUp={handleDragPointerUp}
        onPointerCancel={handleDragPointerUp}
        className={`absolute overflow-hidden rounded-canvas border border-canvas-border bg-canvas-card ${
          isDraggable ? "cursor-grab active:cursor-grabbing" : ""
        }`}
        style={{
          left: card.position.x,
          top: card.position.y,
          width: cardWidth,
          height: bounds.h,
        }}
      >
        <div
          className="h-2 w-full"
          style={{ background: accent ?? CANVAS_ACCENT }}
        />
        <div className="truncate px-6 pt-4 text-[28px] font-medium text-canvas-ink/80">
          {card.question}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      data-canvas-card={card.id}
      {...(contentInteractive ? { [CANVAS_NODE_INTERACTIVE_ATTR]: "" } : {})}
      onPointerDown={handleCardPointerDown}
      onPointerMove={handleDragPointerMove}
      onPointerUp={handleDragPointerUp}
      onPointerCancel={handleDragPointerUp}
      className={`group/card absolute overflow-visible select-text ${
        isDraggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${hideForLanding ? "pointer-events-none invisible" : ""} ${
        isEmptyComposer
          ? "overflow-hidden rounded-canvas border border-canvas-border bg-transparent shadow-artifact"
          : ""
      }`}
      style={{
        left: card.position.x,
        top: card.position.y,
        width: cardWidth,
        ...(isEmptyComposer
          ? { borderWidth: "calc(1px / min(var(--vp-scale, 1), 1))" }
          : {}),
        ...(pendingMinHeight != null ? { minHeight: pendingMinHeight } : {}),
      }}
      aria-hidden={hideForLanding || undefined}
    >
      <MotionCanvasNode
        targetId={card.id}
        targetKind="card"
        bounds={{
          x: card.position.x,
          y: card.position.y,
          w: cardWidth,
          h: pendingMinHeight ?? card.size?.h ?? tuning.fallbackCardHeight,
        }}
      >
      {showBranchPlugs && (
        <>
          <div
            className={canvasSidePlugWrapperClass("left", "card", {
              alwaysVisible: lateralBranches.some((b) => b.side === "left"),
            })}
          >
            <Plug
              side="left"
              accentColour={plugAccent}
              visible
              ariaLabel="Pull a new thread to the left"
              onPointerDown={handleBranchPlugPointerDown("left")}
            />
            {lateralBranches
              .filter((b) => b.side === "left")
              .map((b) => (
                <BranchCollapseToggle
                  key={b.threadId}
                  side="left"
                  collapsed={collapsedBranchThreadIds.includes(b.threadId)}
                  onToggle={() => toggleBranchThreadCollapsed(b.threadId)}
                />
              ))}
            {!lateralBranches.some((b) => b.side === "left") && (
              <BranchPlugHint side="left" />
            )}
          </div>
          <div
            className={canvasSidePlugWrapperClass("right", "card", {
              alwaysVisible: lateralBranches.some((b) => b.side === "right"),
            })}
          >
            <Plug
              side="right"
              accentColour={plugAccent}
              visible
              ariaLabel="Pull a new thread to the right"
              onPointerDown={handleBranchPlugPointerDown("right")}
            />
            {lateralBranches
              .filter((b) => b.side === "right")
              .map((b) => (
                <BranchCollapseToggle
                  key={b.threadId}
                  side="right"
                  collapsed={collapsedBranchThreadIds.includes(b.threadId)}
                  onToggle={() => toggleBranchThreadCollapsed(b.threadId)}
                />
              ))}
            {!lateralBranches.some((b) => b.side === "right") && (
              <BranchPlugHint side="right" />
            )}
          </div>
        </>
      )}
      {isEmptyComposer ? (
        <div
          className="relative min-w-0 overflow-hidden"
          style={qaInsetStyle("emptyComposer")}
          data-coach-target="ask-composer"
        >
          <CanvasSharpContent className="w-full min-w-0">
            <ChatComposer
              variant="canvas"
              cardId={card.id}
              accentColour={plugAccent}
              receivePlugsActive={receivePlugsActive}
              receiveHighlightSide={receiveHighlightSide}
              placeholder={
                card.quotedSelection ? "Ask about this…" : emptyPlaceholder
              }
              lockedPrefix={card.quotedSelection}
              autoFocus
              disabled={turnInProgress}
              onSubmit={submitQuestion}
              trailingControls={
                !isLanding ? (
                  <CardQaMenu
                    cardId={card.id}
                    canvas
                    layout="embedded"
                  />
                ) : undefined
              }
            />
          </CanvasSharpContent>
        </div>
      ) : (
      <div
        className={`chat-casing group/inner relative flex flex-col overflow-hidden rounded-canvas border bg-transparent shadow-artifact transition-shadow hover:shadow-artifactHover ${
          isSelected
            ? "border-canvas-accent ring-2 ring-canvas-accent/25"
            : "border-canvas-border"
        } ${!contentInteractive ? CANVAS_CONTENT_INERT_CLASS : ""}`}
        style={{
          // compensatedStrokeWidth(1, scale, 1) as CSS: 1px at scale ≥ 1,
          // 1/scale below — tracks settle without a React re-render.
          borderWidth: "calc(1px / min(var(--vp-scale, 1), 1))",
          ...(isSelected && accent
            ? { boxShadow: `0 0 0 2px ${accent}40` }
            : {}),
        }}
      >
        {card.status === "thinking" && (
          <div
            className="thinking-accent-bar pointer-events-none absolute inset-x-0 top-0 z-40 h-px bg-canvas-accent"
            aria-hidden
          />
        )}
        <CanvasSharpContent
          worldWidth={cardWidth}
          className="flex min-w-0 flex-col"
        >
          {card.status !== "empty" ? (
            isConversation ? (
              <ConversationCardSurface card={card} accent={accent} />
            ) : (
            <QaTranslucentSurface className="group/body flex min-w-0 flex-col">
              <QaQuestionSection
                accentColour={accent}
                accentBandVariant={isChatCollapsed ? "compact" : "header"}
                style={
                  isChatCollapsed
                    ? qaInsetStyle("questionCollapsed")
                    : qaInsetStyle("question")
                }
              >
                {isChatCollapsed ? (
                  <>
                    <QaQuestionHeaderRow
                      collaborators={
                        showContributors || showStatusBadge ? (
                          <div className="flex min-w-0 items-center gap-2">
                            {showContributors && (
                              <ContributorAvatarStack
                                profiles={contributorProfiles}
                                onlineUserIds={onlineUserIds}
                              />
                            )}
                            {showStatusBadge && (
                              <QaStatusBadge
                                card={card}
                                canvasArtifactNodes={canvasArtifactNodes}
                              />
                            )}
                          </div>
                        ) : null
                      }
                      controls={
                        <CardQaMenu
                          cardId={card.id}
                          canvas
                          layout="embedded"
                        />
                      }
                    />
                    <QuestionAttachments card={card} />
                    <CardQuestionText
                      question={card.question}
                      collapsed
                    />
                  </>
                ) : (
                  <>
                    <QaQuestionHeaderRow
                      collaborators={
                        showContributors || showStatusBadge ? (
                          <div className="flex min-w-0 items-center gap-2">
                            {showContributors && (
                              <ContributorAvatarStack
                                profiles={contributorProfiles}
                                onlineUserIds={onlineUserIds}
                              />
                            )}
                            {showStatusBadge && (
                              <QaStatusBadge
                                card={card}
                                canvasArtifactNodes={canvasArtifactNodes}
                              />
                            )}
                          </div>
                        ) : null
                      }
                      controls={
                        <CardQaMenu
                          cardId={card.id}
                          canvas
                          layout="embedded"
                        />
                      }
                    />
                    <QuestionAttachments card={card} />
                    <CardQuestionText question={card.question} collapsed={false} />
                  </>
                )}
              </QaQuestionSection>

              {!isChatCollapsed && (
                <>
                  <div className="mx-5 shrink-0 h-px bg-canvas-border" />

                  <div
                    data-card-answer
                    className="min-w-0"
                    style={qaInsetStyle("answer")}
                  >
                    <CardAnswerBody
                      card={card}
                      isStreaming={card.status === "streaming"}
                      answerExplains={displayAnswerExplains}
                      textRootRef={answerTextRef}
                      onExplainClick={handleExplainClick}
                      showPendingPlaceholder={
                        turnInProgress && !shouldShowQaAnswerText(card)
                      }
                      pendingLabel={qaStatusLabel}
                      onTryAgain={handleTryAgain}
                    />
                  </div>
                </>
              )}
            </QaTranslucentSurface>
            )
          ) : null}

          {card.status === "done" && !hasChildren && !isChatCollapsed && !isConversation && (
            <div
              data-follow-up-footer
              className="relative z-20 shrink-0 border-t border-canvas-border bg-canvas-card px-3 py-2.5"
            >
              <ChatComposer
                variant="canvas"
                cardId={card.id}
                accentColour={plugAccent}
                receivePlugsActive={receivePlugsActive}
                receiveHighlightSide={receiveHighlightSide}
                placeholder="Follow up"
                onSubmit={submitFollowUp}
              />
            </div>
          )}
        </CanvasSharpContent>
      </div>
      )}
      </MotionCanvasNode>
      {(selection || quickExplainBusy) && menuAnchorRect && (
        <AnswerSelectionMenu
          rect={menuAnchorRect}
          onQuickExplain={handleQuickExplainFromMenu}
          onAskQuestion={handleAskQuestion}
          onAddToCanvas={handleAddToCanvas}
          askDisabled={!canEdit || canvasReadOnly}
          addToCanvasDisabled={!canEdit || canvasReadOnly}
          quickExplainLoading={quickExplainBusy}
        />
      )}
      <AnimatePresence>
        {openExplain && explainAnchorY != null && (
          <QuickExplainPopup
            key={openExplain.id}
            explain={openExplain}
            anchorY={explainAnchorY}
            onClose={() => {
              setOpenExplainId(null);
              setQuickExplainBusy(false);
              setExplainAnchorY(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export const Card = memo(
  CardInner,
  (prev, next) => prev.card === next.card,
);

const BRANCH_PLUG_SIZE_PX = 10;
const BRANCH_PLUG_HINT_GAP_PX = 8;
const BRANCH_PLUG_HINT_OFFSET_PX =
  BRANCH_PLUG_SIZE_PX / 2 + BRANCH_PLUG_HINT_GAP_PX;

function BranchCollapseToggle({
  side,
  collapsed,
  onToggle,
}: {
  side: "left" | "right";
  collapsed: boolean;
  onToggle: () => void;
}) {
  const isLeft = side === "left";

  return (
    <button
      type="button"
      aria-label={collapsed ? "Expand branch" : "Collapse branch"}
      title={collapsed ? "Expand branch" : "Collapse branch"}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`pointer-events-auto absolute top-1/2 z-40 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-canvas-border bg-canvas-card text-canvas-body-sm font-medium text-canvas-muted shadow-sm transition-colors hover:bg-canvas-bg hover:text-canvas-ink ${
        isLeft ? "right-full" : "left-full"
      }`}
      style={{
        ...(isLeft
          ? { marginRight: BRANCH_PLUG_HINT_OFFSET_PX }
          : { marginLeft: BRANCH_PLUG_HINT_OFFSET_PX }),
      }}
    >
      {collapsed ? "+" : "−"}
    </button>
  );
}

function BranchPlugHint({ side }: { side: "left" | "right" }) {
  const isLeft = side === "left";

  return (
    <span
      className={`pointer-events-none absolute top-1/2 z-30 -translate-y-1/2 whitespace-nowrap text-canvas-body-sm text-canvas-muted ${
        isLeft ? "right-full text-right" : "left-full text-left"
      }`}
      style={{
        ...(isLeft
          ? { marginRight: BRANCH_PLUG_HINT_OFFSET_PX }
          : { marginLeft: BRANCH_PLUG_HINT_OFFSET_PX }),
      }}
    >
      Pull a branch
    </span>
  );
}

