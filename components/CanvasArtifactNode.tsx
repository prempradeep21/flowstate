"use client";



import {

  PointerEvent as ReactPointerEvent,

  useEffect,

  useRef,

} from "react";

import { ArtifactShell } from "@/components/artifacts/ArtifactShell";

import { Plug } from "@/components/plugs/Plug";

import { getArtifactBounds } from "@/lib/canvasNodeBounds";

import { plugAnchorAt } from "@/lib/plugConnector";

import {

  useCanvasStore,

  type CanvasArtifactNode as CanvasArtifactNodeType,

} from "@/lib/store";

import { isGodViewMode } from "@/lib/zoomDisplay";



const DRAG_THRESHOLD_PX = 4;

const INTERACTIVE =

  "button, textarea, input, select, a, [role='menu'], [data-no-drag], [data-plug]";



interface CanvasArtifactNodeProps {

  node: CanvasArtifactNodeType;

}



export function CanvasArtifactNode({ node }: CanvasArtifactNodeProps) {

  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);

  const cards = useCanvasStore((s) => s.cards);

  const threads = useCanvasStore((s) => s.threads);

  const scale = useCanvasStore((s) => s.viewport.scale);

  const selectedCanvasArtifactId = useCanvasStore(

    (s) => s.selectedCanvasArtifactId,

  );

  const moveCanvasArtifact = useCanvasStore((s) => s.moveCanvasArtifact);

  const selectCanvasArtifact = useCanvasStore((s) => s.selectCanvasArtifact);

  const setCanvasArtifactVersion = useCanvasStore(

    (s) => s.setCanvasArtifactVersion,

  );

  const openSessionArtifact = useCanvasStore((s) => s.openSessionArtifact);

  const removeCanvasArtifact = useCanvasStore((s) => s.removeCanvasArtifact);

  const recordUndo = useCanvasStore((s) => s.recordUndo);

  const setCanvasArtifactSize = useCanvasStore((s) => s.setCanvasArtifactSize);

  const startPlugDrag = useCanvasStore((s) => s.startPlugDrag);



  const dragStateRef = useRef<{

    pointerId: number;

    lastX: number;

    lastY: number;

    didMove: boolean;

    recordedUndo: boolean;

  } | null>(null);

  const nodeRef = useRef<HTMLDivElement | null>(null);



  const art = sessionArtifacts[node.artifactId];

  const isSelected = selectedCanvasArtifactId === node.id;

  const { w: width, h: artifactHeight } = getArtifactBounds(node, art);

  const godView = isGodViewMode(scale);

  const sourceCard = cards[node.sourceCardId];

  const plugAccent =

    (sourceCard && threads[sourceCard.threadId]?.accentColour) ?? "#7C9EFF";



  useEffect(() => {

    const el = nodeRef.current;

    if (!el) return;

    const update = () => {

      setCanvasArtifactSize(node.id, {

        w: el.offsetWidth,

        h: el.offsetHeight,

      });

    };

    update();

    const ro = new ResizeObserver(update);

    ro.observe(el);

    return () => ro.disconnect();

  }, [node.id, setCanvasArtifactSize, width]);



  const artifactPlugWorld = (side: "left" | "right") => {

    const anchor = plugAnchorAt(

      node.position.x,

      node.position.y,

      width,

      artifactHeight,

      side,

    );

    return { x: anchor.px, y: anchor.py };

  };



  const handleArtifactPlugPointerDown =

    (side: "left" | "right") => (e: ReactPointerEvent<HTMLButtonElement>) => {

      e.stopPropagation();

      e.preventDefault();

      startPlugDrag({

        kind: "artifact",

        artifactNodeId: node.id,

        artifactId: node.artifactId,

        versionId: node.versionId,

        fromSide: side,

        pointerWorld: artifactPlugWorld(side),

        didDrag: false,

        receiveTargetCardId: null,

        hoveredReceiveSide: null,

      });

    };



  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {

    if (e.button !== 0) return;

    const target = e.target as HTMLElement;

    if (target.closest(INTERACTIVE)) return;



    e.stopPropagation();

    e.preventDefault();

    selectCanvasArtifact(node.id);

    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

    dragStateRef.current = {

      pointerId: e.pointerId,

      lastX: e.clientX,

      lastY: e.clientY,

      didMove: false,

      recordedUndo: false,

    };

  };



  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {

    const ds = dragStateRef.current;

    if (!ds || ds.pointerId !== e.pointerId) return;



    const screenDx = e.clientX - ds.lastX;

    const screenDy = e.clientY - ds.lastY;

    const dist = Math.hypot(screenDx, screenDy);

    if (!ds.didMove && dist < DRAG_THRESHOLD_PX) return;



    if (!ds.recordedUndo) {

      recordUndo();

      ds.recordedUndo = true;

    }

    ds.didMove = true;

    ds.lastX = e.clientX;

    ds.lastY = e.clientY;

    const vpScale = useCanvasStore.getState().viewport.scale;

    moveCanvasArtifact(node.id, screenDx / vpScale, screenDy / vpScale);

  };



  const handlePointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {

    const ds = dragStateRef.current;

    if (!ds || ds.pointerId !== e.pointerId) return;

    try {

      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

    } catch {

      // ignore

    }

    dragStateRef.current = null;

  };



  if (!art) return null;

  return (

    <div

      ref={nodeRef}

      data-canvas-artifact

      onPointerDown={handlePointerDown}

      onPointerMove={handlePointerMove}

      onPointerUp={handlePointerUp}

      onPointerCancel={handlePointerUp}

      className={`group/artifact absolute cursor-grab overflow-visible active:cursor-grabbing ${

        isSelected ? "z-30" : "z-20"

      }`}

      style={{

        left: node.position.x,

        top: node.position.y,

        width,

      }}

    >

      {!godView && (

        <>

          <div className="pointer-events-none absolute inset-y-0 left-0 z-30 opacity-0 transition-opacity group-hover/artifact:opacity-100 [&_button]:pointer-events-auto">

            <Plug

              side="left"

              accentColour={plugAccent}

              visible

              ariaLabel="Pull artifact context into a question"

              onPointerDown={handleArtifactPlugPointerDown("left")}

            />

          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 z-30 opacity-0 transition-opacity group-hover/artifact:opacity-100 [&_button]:pointer-events-auto">

            <Plug

              side="right"

              accentColour={plugAccent}

              visible

              ariaLabel="Pull artifact context into a question"

              onPointerDown={handleArtifactPlugPointerDown("right")}

            />

          </div>

        </>

      )}

      <div

        className={`rounded-artifact-card border bg-canvas-card p-5 shadow-card transition-shadow hover:shadow-cardHover ${

          isSelected

            ? "border-canvas-ink ring-2 ring-canvas-ink/25"

            : "border-canvas-border"

        }`}

      >

        <ArtifactShell

          sessionArtifact={art}

          versionId={node.versionId}

          onVersionChange={(vid) => setCanvasArtifactVersion(node.id, vid)}

          menuVariant="canvas"

          onExpand={() =>

            openSessionArtifact(node.artifactId, node.versionId)

          }

          onRemoveFromCanvas={() => removeCanvasArtifact(node.id)}

        />

      </div>

    </div>

  );

}


