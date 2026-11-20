import { isDerivedLayoutWrite } from "@/lib/derivedLayoutWrite";

/**
 * Who caused a store write, for the canvas trace (lib/canvasFlightRecorder).
 * Zustand notifies subscribers synchronously inside `set()`, so a label set
 * around a call is visible to the recorder for exactly the writes it makes.
 */
export type CanvasWriteSource =
  | "drag"
  | "layout"
  | "remote-snapshot"
  | "conflict-merge"
  | "load"
  | "undo";

const stack: CanvasWriteSource[] = [];

export function withWriteSource<T>(source: CanvasWriteSource, fn: () => T): T {
  stack.push(source);
  try {
    return fn();
  } finally {
    stack.pop();
  }
}

export function currentWriteSource(): CanvasWriteSource | null {
  if (stack.length > 0) return stack[stack.length - 1]!;
  return isDerivedLayoutWrite() ? "layout" : null;
}
