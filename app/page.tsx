"use client";

import { useEffect, useRef } from "react";
import { Canvas } from "@/components/Canvas";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { ModelSelector } from "@/components/ModelSelector";
import { useCanvasStore } from "@/lib/store";

const INITIAL_CARD_WIDTH = 420;
const INITIAL_CARD_HEIGHT_GUESS = 180;

export default function Page() {
  const seeded = useRef(false);
  const createRootCard = useCanvasStore((s) => s.createRootCard);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const cardCount = useCanvasStore((s) => s.cardOrder.length);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (cardCount > 0) return;

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    createRootCard({
      x: cx - INITIAL_CARD_WIDTH / 2,
      y: cy - INITIAL_CARD_HEIGHT_GUESS / 2,
    });
    setViewport({ x: 0, y: 0, scale: 1 });
  }, [cardCount, createRootCard, setViewport]);

  return (
    <main className="fixed inset-0">
      <Canvas />
      <ArtifactPanel />
      <div className="pointer-events-none fixed top-4 right-4 z-50">
        <ModelSelector />
      </div>
    </main>
  );
}
