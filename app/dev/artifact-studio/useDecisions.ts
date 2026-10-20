"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Design decisions taken in the focus view — a verdict and a note per artifact
 * per style family. Lives in this browser only (dev tool); "Copy decisions"
 * exports it as JSON to hand over.
 */

export type Verdict = "keep" | "revise" | "drop";

export const VERDICT_META: Record<Verdict, { label: string; color: string }> = {
  keep: { label: "Keep", color: "#1f9d55" },
  revise: { label: "Revise", color: "#d97706" },
  drop: { label: "Drop", color: "#dc2626" },
};

export interface Decision {
  verdict?: Verdict;
  note?: string;
  title: string;
  variant: string;
  updatedAt: string;
}

type DecisionMap = Record<string, Decision>;

const STORAGE_KEY = "flowstate.artifactStudio.decisions";
const listeners = new Set<() => void>();
let cache: DecisionMap | null = null;

function read(): DecisionMap {
  if (cache) return cache;
  try {
    cache = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "{}") as DecisionMap;
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: DecisionMap) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage blocked — decisions still hold for this session.
  }
  for (const l of listeners) l();
}

const EMPTY: DecisionMap = {};
const keyOf = (familyId: string, uid: string) => `${familyId}::${uid}`;

export function useDecisions() {
  const map = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );

  const get = useCallback(
    (familyId: string, uid: string): Decision | undefined => map[keyOf(familyId, uid)],
    [map],
  );

  const set = useCallback(
    (familyId: string, uid: string, patch: Partial<Decision> & Pick<Decision, "title" | "variant">) => {
      const key = keyOf(familyId, uid);
      const prev = read()[key];
      const merged: Decision = { ...prev, ...patch, updatedAt: new Date().toISOString() };
      const next = { ...read() };
      if (!merged.verdict && !merged.note?.trim()) delete next[key];
      else next[key] = merged;
      write(next);
    },
    [],
  );

  return { map, get, set, count: Object.keys(map).length };
}
