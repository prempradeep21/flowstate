"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  BASE_RUN_SPEED,
  buildJumpArc,
  clampToFoothold,
  jumpEndpoints,
  neighborIndex,
  petTransform,
  runStep,
  sampleJumpArc,
} from "@/lib/pet/stickmanEngine";
import { chooseNextAction, nextDecisionDelay } from "@/lib/pet/brain";
import type { BrainAction, Foothold, PetPose } from "@/lib/pet/types";

export interface StickmanCommands {
  /** Snap the pet onto foothold `index` (center), standing. */
  place: (index: number) => void;
  /** Run toward the edge of the current foothold in `direction`. */
  run: (direction: -1 | 1) => void;
  /** Run to the edge, then leap to the neighbouring foothold. */
  jump: (direction: -1 | 1) => void;
  dance: () => void;
  rest: () => void;
  /** Toggle the free-will brain. */
  setAuto: (enabled: boolean) => void;
  /** Re-measure hook: re-seat the pet after footholds change. */
  reseat: () => void;
}

/**
 * Imperative animation core for the stickman.
 *
 * Performance contract:
 * - No React state updates during motion — position goes straight to
 *   `petRef.style.transform`, pose to `data-pose` (CSS does the limbs).
 * - The rAF loop exists ONLY while running or mid-jump; static poses cancel
 *   it and wait on a single setTimeout.
 * - Foothold geometry is read from `getFootholds()` (cached numbers), never
 *   from the DOM inside the loop.
 */
export function useStickmanEngine({
  petRef,
  getFootholds,
  size,
  speedRef,
  onPoseChange,
}: {
  petRef: React.RefObject<HTMLDivElement | null>;
  getFootholds: () => Foothold[];
  size: number;
  speedRef: React.MutableRefObject<number>;
  onPoseChange?: (pose: PetPose) => void;
}): StickmanCommands {
  const m = useRef({
    x: 0,
    y: 0,
    holdIndex: 0,
    facing: 1 as 1 | -1,
    raf: 0,
    timer: 0 as ReturnType<typeof setTimeout> | 0,
    auto: false,
    lastKind: undefined as BrainAction["kind"] | undefined,
    size,
  });
  m.current.size = size;

  const onPoseChangeRef = useRef(onPoseChange);
  onPoseChangeRef.current = onPoseChange;

  const applyPosition = useCallback(() => {
    const el = petRef.current;
    if (el) el.style.transform = petTransform(m.current, m.current.size);
  }, [petRef]);

  const setPose = useCallback(
    (pose: PetPose) => {
      const el = petRef.current;
      if (el && el.dataset.pose !== pose) {
        el.dataset.pose = pose;
        onPoseChangeRef.current?.(pose);
      }
    },
    [petRef],
  );

  const setFacing = useCallback(
    (facing: 1 | -1) => {
      m.current.facing = facing;
      const el = petRef.current;
      if (el) el.dataset.facing = String(facing);
    },
    [petRef],
  );

  const cancelMotion = useCallback(() => {
    if (m.current.raf) cancelAnimationFrame(m.current.raf);
    m.current.raf = 0;
    if (m.current.timer) clearTimeout(m.current.timer);
    m.current.timer = 0;
  }, []);

  /* ---- forward declaration so actions can chain back into the brain ---- */
  const scheduleBrainRef = useRef<() => void>(() => {});

  const settle = useCallback(() => {
    setPose("stand");
    scheduleBrainRef.current();
  }, [setPose]);

  /** rAF run toward targetX, then `done`. */
  const startRun = useCallback(
    (targetX: number, done: () => void) => {
      cancelMotion();
      setFacing(targetX >= m.current.x ? 1 : -1);
      if (Math.abs(targetX - m.current.x) < 1) {
        done();
        return;
      }
      setPose("run");
      let last = performance.now();
      const tick = (now: number) => {
        const dt = Math.min(48, now - last); // clamp tab-switch jumps
        last = now;
        const speed = BASE_RUN_SPEED * speedRef.current;
        const step = runStep(m.current.x, targetX, speed, dt);
        m.current.x = step.x;
        applyPosition();
        if (step.done) {
          m.current.raf = 0;
          done();
        } else {
          m.current.raf = requestAnimationFrame(tick);
        }
      };
      m.current.raf = requestAnimationFrame(tick);
    },
    [applyPosition, cancelMotion, setFacing, setPose, speedRef],
  );

  /** rAF flight along a prebuilt arc, then `done`. */
  const startFlight = useCallback(
    (
      arc: ReturnType<typeof buildJumpArc>,
      landIndex: number,
      done: () => void,
    ) => {
      setPose("jump");
      setFacing(arc.to.x >= arc.from.x ? 1 : -1);
      const start = performance.now();
      const tick = (now: number) => {
        const t = (now - start) / arc.duration;
        const p = sampleJumpArc(arc, t);
        m.current.x = p.x;
        m.current.y = p.y;
        applyPosition();
        if (t >= 1) {
          m.current.raf = 0;
          m.current.holdIndex = landIndex;
          done();
        } else {
          m.current.raf = requestAnimationFrame(tick);
        }
      };
      m.current.raf = requestAnimationFrame(tick);
    },
    [applyPosition, setFacing, setPose],
  );

  /* ------------------------------ actions ------------------------------ */

  const place = useCallback(
    (index: number) => {
      cancelMotion();
      const holds = getFootholds();
      const hold = holds[Math.min(index, holds.length - 1)];
      if (!hold) return;
      m.current.holdIndex = holds.indexOf(hold);
      m.current.x = clampToFoothold((hold.left + hold.right) / 2, hold);
      m.current.y = hold.surfaceY;
      applyPosition();
      setPose("stand");
    },
    [applyPosition, cancelMotion, getFootholds, setPose],
  );

  const run = useCallback(
    (direction: -1 | 1, onDone?: () => void, targetXOverride?: number) => {
      const holds = getFootholds();
      const hold = holds[m.current.holdIndex];
      if (!hold) return;
      m.current.lastKind = "wander";
      const targetX =
        targetXOverride ??
        clampToFoothold(direction === 1 ? hold.right : hold.left, hold);
      startRun(targetX, onDone ?? settle);
    },
    [getFootholds, settle, startRun],
  );

  const jump = useCallback(
    (direction: -1 | 1) => {
      const holds = getFootholds();
      const from = holds[m.current.holdIndex];
      const toIndex = neighborIndex(m.current.holdIndex, direction, holds.length);
      if (!from) return;
      m.current.lastKind = "jump";
      if (toIndex === -1) {
        // Nowhere to go — a small refusal hop in place.
        const hop = buildJumpArc(
          { x: m.current.x, y: m.current.y },
          { x: m.current.x, y: m.current.y },
        );
        cancelMotion();
        startFlight(hop, m.current.holdIndex, settle);
        return;
      }
      const to = holds[toIndex];
      const { takeoff, landing } = jumpEndpoints(from, to);
      // Phase 1: run to the take-off edge. Phase 2: fly.
      startRun(takeoff.x, () => {
        m.current.y = takeoff.y;
        const arc = buildJumpArc(
          { x: m.current.x, y: m.current.y },
          landing,
        );
        startFlight(arc, toIndex, settle);
      });
    },
    [cancelMotion, getFootholds, settle, startFlight, startRun],
  );

  const holdPose = useCallback(
    (pose: PetPose, kind: BrainAction["kind"], durationMs: number) => {
      cancelMotion();
      m.current.lastKind = kind;
      setPose(pose);
      m.current.timer = setTimeout(() => {
        m.current.timer = 0;
        settle();
      }, durationMs);
    },
    [cancelMotion, setPose, settle],
  );

  const dance = useCallback(
    () => holdPose("dance", "dance", 2600),
    [holdPose],
  );
  const rest = useCallback(() => holdPose("rest", "rest", 3400), [holdPose]);

  /* ----------------------------- free will ----------------------------- */

  const executeBrainAction = useCallback(
    (action: BrainAction) => {
      switch (action.kind) {
        case "jump":
          jump(action.direction);
          break;
        case "wander": {
          const holds = getFootholds();
          const hold = holds[m.current.holdIndex];
          if (!hold) return;
          const targetX = clampToFoothold(
            hold.left + Math.random() * (hold.right - hold.left),
            hold,
          );
          run(targetX >= m.current.x ? 1 : -1, settle, targetX);
          break;
        }
        case "dance":
          dance();
          break;
        case "rest":
          rest();
          break;
        case "idle":
          m.current.lastKind = "idle";
          settle();
          break;
      }
    },
    [dance, getFootholds, jump, rest, run, settle],
  );

  scheduleBrainRef.current = () => {
    if (!m.current.auto) return;
    if (m.current.timer) clearTimeout(m.current.timer);
    m.current.timer = setTimeout(() => {
      m.current.timer = 0;
      if (!m.current.auto) return;
      const holds = getFootholds();
      executeBrainAction(
        chooseNextAction({
          footholdIndex: m.current.holdIndex,
          footholdCount: holds.length,
          lastKind: m.current.lastKind,
        }),
      );
    }, nextDecisionDelay());
  };

  const setAuto = useCallback(
    (enabled: boolean) => {
      m.current.auto = enabled;
      if (enabled) {
        scheduleBrainRef.current();
      } else if (m.current.timer) {
        clearTimeout(m.current.timer);
        m.current.timer = 0;
      }
    },
    [],
  );

  const reseat = useCallback(() => {
    place(m.current.holdIndex);
  }, [place]);

  /* ------------------------------ lifecycle ---------------------------- */

  useEffect(() => {
    const state = m.current;
    return () => {
      state.auto = false;
      if (state.raf) cancelAnimationFrame(state.raf);
      if (state.timer) clearTimeout(state.timer);
    };
  }, []);

  return useMemo(
    () => ({
      place,
      run: (d: -1 | 1) => run(d),
      jump,
      dance,
      rest,
      setAuto,
      reseat,
    }),
    [dance, jump, place, reseat, rest, run, setAuto],
  );
}
