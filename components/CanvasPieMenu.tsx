"use client";

import { createPortal } from "react-dom";
import { AnimatePresence, m } from "framer-motion";
import type { ComponentType } from "react";
import {
  PIE_PILL_DISTANCE_PX,
  PIE_SECTORS,
  PIE_SECTOR_ANGLE_DEG,
  type PieSectorId,
} from "@/lib/canvasPieMenu";
import { piePillVariants, pieRingVariants } from "@/lib/motion/variants";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import { useClientMounted } from "@/hooks/useClientMounted";
import { QuestionIcon, TypeIcon } from "@/components/MenuIcons";

export interface PieMenuState {
  /** Clamped menu center in client (viewport) coordinates. */
  centerX: number;
  centerY: number;
  activeSector: PieSectorId | null;
}

const SECTOR_ICONS: Partial<Record<PieSectorId, ComponentType>> = {
  north: QuestionIcon,
  west: TypeIcon,
};

const RING_SIZE_PX = 40;

/**
 * Hold-Z pie menu overlay. Pure gesture surface — the whole layer is
 * pointer-events-none; selection is driven by pointer angle + Z keyup in
 * useCanvasPieMenu, never by clicks.
 */
export function CanvasPieMenu({ state }: { state: PieMenuState | null }) {
  const mounted = useClientMounted();
  const reducedMotion = useReducedMotion();

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {state && (
        <div
          key="canvas-pie-menu"
          className="pointer-events-none fixed inset-0 z-[50000]"
          aria-hidden
        >
          {/* Center ring with directional notch toward the armed sector */}
          <m.div
            initial={reducedMotion ? "reduced" : "initial"}
            animate={reducedMotion ? "reduced" : "animate"}
            exit={reducedMotion ? "reducedExit" : "exit"}
            variants={pieRingVariants}
            className="absolute rounded-full border-4 border-canvas-border bg-canvas-card/40"
            style={{
              left: state.centerX - RING_SIZE_PX / 2,
              top: state.centerY - RING_SIZE_PX / 2,
              width: RING_SIZE_PX,
              height: RING_SIZE_PX,
            }}
          >
            <div
              className="absolute inset-[-4px] transition-[transform,opacity] duration-100 ease-out"
              style={{
                transform: `rotate(${
                  state.activeSector
                    ? PIE_SECTOR_ANGLE_DEG[state.activeSector]
                    : 0
                }deg)`,
                opacity: state.activeSector ? 1 : 0,
              }}
            >
              <div className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[2px] bg-canvas-ink" />
            </div>
          </m.div>

          {PIE_SECTORS.map((sector) => {
            const Icon = SECTOR_ICONS[sector.id];
            const active = state.activeSector === sector.id;
            return (
              <div
                key={sector.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: state.centerX + sector.dir.x * PIE_PILL_DISTANCE_PX,
                  top: state.centerY + sector.dir.y * PIE_PILL_DISTANCE_PX,
                }}
              >
                <m.div
                  custom={{
                    index: sector.clockwiseIndex,
                    dirX: sector.dir.x,
                    dirY: sector.dir.y,
                  }}
                  initial={reducedMotion ? "reduced" : "initial"}
                  animate={reducedMotion ? "reduced" : "animate"}
                  exit={reducedMotion ? "reducedExit" : "exit"}
                  variants={piePillVariants}
                >
                  <div
                    className={`flex items-center gap-2 whitespace-nowrap rounded-canvas border px-3 py-2 text-canvas-body-sm font-medium shadow-card transition-[transform,background-color,border-color] duration-100 ease-out ${
                      sector.enabled
                        ? active
                          ? "scale-[1.04] border-canvas-ink/40 bg-canvas-bg text-canvas-ink"
                          : "border-canvas-border bg-canvas-card text-canvas-ink"
                        : "border-canvas-border bg-canvas-card opacity-40"
                    }`}
                  >
                    {Icon && (
                      <span className="text-canvas-muted">
                        <Icon />
                      </span>
                    )}
                    <span>{sector.label}</span>
                    {sector.shortcut && (
                      <span className="text-canvas-muted">
                        [{sector.shortcut}]
                      </span>
                    )}
                  </div>
                </m.div>
              </div>
            );
          })}
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
