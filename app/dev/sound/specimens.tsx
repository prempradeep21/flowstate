"use client";

import { useCallback, useRef, useState } from "react";
import { playSound } from "@/lib/sounds/engine";
import type { SoundEventId } from "@/lib/sounds/types";

const DRAG_THRESHOLD_PX = 5;

interface SpecimenProps {
  eventId: SoundEventId;
  onTrigger: (eventId: SoundEventId) => void;
}

export function CardDragSpecimen({ eventId, onTrigger }: SpecimenProps) {
  const [pos, setPos] = useState({ x: 24, y: 24 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    didMove: boolean;
    started: boolean;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      didMove: false,
      started: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragRef.current;
    if (!ds) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (!ds.didMove && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    if (!ds.started) {
      ds.started = true;
      onTrigger("card-drag-start");
    }
    ds.didMove = true;
    setPos({ x: ds.originX + dx, y: ds.originY + dy });
  };

  const onPointerUp = () => {
    const ds = dragRef.current;
    if (ds?.didMove) onTrigger("card-drag-drop");
    dragRef.current = null;
  };

  return (
    <div className="relative h-36 overflow-hidden rounded-canvas border border-dashed border-canvas-border bg-canvas-bg">
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        className="absolute left-0 top-0 w-28 cursor-grab rounded-canvas border border-canvas-border bg-canvas-card p-2 shadow-card active:cursor-grabbing"
      >
        <p className="text-canvas-micro font-medium text-canvas-ink">Drag me</p>
        <p className="text-canvas-micro text-canvas-muted">{eventId}</p>
      </div>
    </div>
  );
}

export function ArtifactDragSpecimen({ onTrigger }: { onTrigger: (eventId: SoundEventId) => void }) {
  const [pos, setPos] = useState({ x: 40, y: 28 });
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    didMove: boolean;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      didMove: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const ds = dragRef.current;
    if (!ds) return;
    const dx = e.clientX - ds.startX;
    const dy = e.clientY - ds.startY;
    if (!ds.didMove && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
    ds.didMove = true;
    setPos({ x: ds.originX + dx, y: ds.originY + dy });
  };

  const onPointerUp = () => {
    if (dragRef.current?.didMove) onTrigger("artifact-drag-drop");
    dragRef.current = null;
  };

  return (
    <div className="relative h-36 overflow-hidden rounded-canvas border border-dashed border-canvas-border bg-canvas-bg">
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        className="absolute left-0 top-0 flex h-16 w-16 cursor-grab items-center justify-center rounded-canvas border-2 border-canvas-accent/40 bg-canvas-card text-canvas-micro font-medium text-canvas-ink shadow-card active:cursor-grabbing"
      >
        Artifact
      </div>
    </div>
  );
}

export function CanvasPanSpecimen({ onTrigger }: { onTrigger: (eventId: SoundEventId) => void }) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const panRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    panRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const pan = panRef.current;
    if (!pan) return;
    const dx = e.clientX - pan.x;
    const dy = e.clientY - pan.y;
    if (Math.hypot(dx, dy) > 2) onTrigger("canvas-pan");
    setOffset({ x: pan.ox + dx, y: pan.oy + dy });
  };

  const onPointerUp = () => {
    panRef.current = null;
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="relative h-36 cursor-grab overflow-hidden rounded-canvas border border-canvas-border bg-canvas-bg active:cursor-grabbing"
      style={{
        backgroundImage:
          "radial-gradient(circle, var(--dot-color, #d4d4d0) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        backgroundPosition: `${offset.x}px ${offset.y}px`,
      }}
    >
      <p className="absolute bottom-2 left-2 text-canvas-micro text-canvas-muted">
        Pan the dot grid
      </p>
    </div>
  );
}

export function CollapseSpecimen({
  label,
  onTrigger,
  eventId,
}: {
  label: string;
  eventId: SoundEventId;
  onTrigger: (eventId: SoundEventId) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setCollapsed((prev) => !prev);
        onTrigger(eventId);
      }}
      className="flex h-36 w-full flex-col items-start justify-between rounded-canvas border border-canvas-border bg-canvas-card p-3 text-left transition-colors hover:border-canvas-muted"
    >
      <span className="text-canvas-compact font-medium text-canvas-ink">{label}</span>
      <span
        className={`rounded-canvas-sm border border-canvas-border px-2 py-1 text-canvas-micro text-canvas-muted transition-all ${
          collapsed ? "opacity-40" : "opacity-100"
        }`}
      >
        {collapsed ? "Collapsed" : "Expanded"} — click to toggle
      </span>
    </button>
  );
}

export function BranchCreateSpecimen({ onTrigger }: { onTrigger: (eventId: SoundEventId) => void }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="flex h-36 flex-col justify-center gap-3 rounded-canvas border border-canvas-border bg-canvas-bg p-3">
      <div className="flex items-center gap-3">
        <div className="h-10 w-16 rounded-canvas-sm border border-canvas-border bg-canvas-card" />
        <button
          type="button"
          onPointerDown={() => setDragging(true)}
          onPointerUp={() => {
            if (dragging) onTrigger("branch-create");
            setDragging(false);
          }}
          onPointerLeave={() => setDragging(false)}
          className={`h-4 w-4 rounded-full border-2 transition-colors ${
            dragging
              ? "border-canvas-accent bg-canvas-accent"
              : "border-canvas-muted bg-canvas-card"
          }`}
          aria-label="Drag branch plug"
        />
        {dragging && (
          <div className="h-0.5 flex-1 bg-canvas-accent/50" aria-hidden />
        )}
      </div>
      <p className="text-canvas-micro text-canvas-muted">
        Press and release the plug to simulate branch creation
      </p>
    </div>
  );
}

export function PlugConnectSpecimen({ onTrigger }: { onTrigger: (eventId: SoundEventId) => void }) {
  const [connected, setConnected] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        setConnected(true);
        onTrigger("plug-connect");
        window.setTimeout(() => setConnected(false), 600);
      }}
      className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-canvas border border-canvas-border bg-canvas-card transition-colors hover:border-canvas-muted"
    >
      <div className="flex items-center gap-2">
        <span className="h-8 w-8 rounded-canvas-sm border border-canvas-border bg-canvas-bg" />
        <span
          className={`h-0.5 w-10 transition-colors ${
            connected ? "bg-canvas-accent" : "bg-canvas-border"
          }`}
        />
        <span className="h-10 w-14 rounded-canvas-sm border border-canvas-border bg-canvas-bg" />
      </div>
      <span className="text-canvas-micro text-canvas-muted">Simulate plug snap</span>
    </button>
  );
}

export function PanelSlideSpecimen({
  open,
  onOpen,
  onClose,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative h-36 overflow-hidden rounded-canvas border border-canvas-border bg-canvas-bg">
      <div className="absolute inset-y-0 left-0 w-2/3 border-r border-canvas-border bg-canvas-card/80 p-2">
        <p className="text-canvas-micro text-canvas-muted">Canvas area</p>
      </div>
      <div
        className={`absolute inset-y-0 right-0 w-1/3 border-l border-canvas-border bg-canvas-card shadow-card transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <p className="p-2 text-canvas-micro font-medium text-canvas-ink">Artifact panel</p>
      </div>
      <div className="absolute bottom-2 left-2 flex gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="rounded-canvas-sm border border-canvas-border bg-canvas-card px-2 py-1 text-canvas-micro text-canvas-ink hover:border-canvas-muted"
        >
          Open
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-canvas-sm border border-canvas-border bg-canvas-card px-2 py-1 text-canvas-micro text-canvas-ink hover:border-canvas-muted"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export function AgentStatusSpecimen({ onTrigger }: { onTrigger: (eventId: SoundEventId) => void }) {
  const [status, setStatus] = useState<"idle" | "thinking" | "streaming" | "done" | "error">("idle");

  const runSuccess = () => {
    setStatus("thinking");
    onTrigger("agent-thinking-start");
    window.setTimeout(() => {
      setStatus("streaming");
      onTrigger("agent-streaming-start");
    }, 500);
    window.setTimeout(() => {
      setStatus("done");
      onTrigger("agent-complete");
    }, 1200);
  };

  const runError = () => {
    setStatus("thinking");
    onTrigger("agent-thinking-start");
    window.setTimeout(() => {
      setStatus("error");
      onTrigger("agent-error");
    }, 700);
  };

  return (
    <div className="flex h-36 flex-col justify-between rounded-canvas border border-canvas-border bg-canvas-card p-3">
      <div className="flex items-center gap-2">
        <span className="rounded-canvas-sm bg-canvas-bg px-2 py-0.5 text-canvas-micro font-medium capitalize text-canvas-ink">
          {status}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={runSuccess}
          className="rounded-canvas-sm border border-canvas-border px-2 py-1 text-canvas-micro text-canvas-ink hover:border-canvas-muted"
        >
          Run success flow
        </button>
        <button
          type="button"
          onClick={runError}
          className="rounded-canvas-sm border border-canvas-border px-2 py-1 text-canvas-micro text-canvas-ink hover:border-canvas-muted"
        >
          Run error flow
        </button>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="rounded-canvas-sm border border-canvas-border px-2 py-1 text-canvas-micro text-canvas-muted hover:border-canvas-muted"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export function UndoRedoSpecimen({ onTrigger }: { onTrigger: (eventId: SoundEventId) => void }) {
  return (
    <div className="flex h-36 items-center justify-center gap-3 rounded-canvas border border-canvas-border bg-canvas-bg">
      <button
        type="button"
        onClick={() => onTrigger("undo")}
        className="rounded-canvas border border-canvas-border bg-canvas-card px-4 py-2 text-canvas-compact font-medium text-canvas-ink hover:border-canvas-muted"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={() => onTrigger("redo")}
        className="rounded-canvas border border-canvas-border bg-canvas-card px-4 py-2 text-canvas-compact font-medium text-canvas-ink hover:border-canvas-muted"
      >
        Redo
      </button>
    </div>
  );
}

export function FocusPulseSpecimen({ onTrigger }: { onTrigger: (eventId: SoundEventId) => void }) {
  const [pulse, setPulse] = useState(false);

  const trigger = useCallback(() => {
    setPulse(true);
    onTrigger("artifact-focus");
    window.setTimeout(() => setPulse(false), 400);
  }, [onTrigger]);

  return (
    <button
      type="button"
      onClick={trigger}
      className="flex h-36 w-full items-center justify-center rounded-canvas border border-canvas-border bg-canvas-bg"
    >
      <span
        className={`rounded-canvas border border-canvas-border bg-canvas-card px-4 py-3 text-canvas-compact font-medium text-canvas-ink transition-transform ${
          pulse ? "scale-110 ring-2 ring-canvas-accent/50" : ""
        }`}
      >
        Focus artifact
      </span>
    </button>
  );
}

export function PlayMappedButton({
  eventId,
  disabled = false,
}: {
  eventId: SoundEventId;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => void playSound(eventId, { force: true })}
      className="rounded-canvas-sm border border-canvas-border px-2.5 py-1.5 text-canvas-micro font-medium text-canvas-ink transition-colors hover:border-canvas-muted hover:bg-canvas-bg disabled:cursor-not-allowed disabled:opacity-40"
    >
      Play mapped sound
    </button>
  );
}
