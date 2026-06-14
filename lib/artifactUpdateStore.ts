import type { ArtifactKind } from "@/lib/artifactTypes";
import { create } from "zustand";

export type ArtifactUpdateStatus = "ready" | "error";

export interface ArtifactUpdate {
  id: string;
  dedupeKey: string;
  status: ArtifactUpdateStatus;
  kind?: ArtifactKind;
  title: string;
  detail: string;
  artifactId?: string;
  nodeId?: string;
  cardId?: string;
  createdAt: number;
}

const MAX_UPDATES = 20;

interface ArtifactUpdateState {
  updates: ArtifactUpdate[];
  pushUpdate: (update: Omit<ArtifactUpdate, "id" | "createdAt">) => void;
  dismissUpdate: (id: string) => void;
}

export const useArtifactUpdateStore = create<ArtifactUpdateState>((set, get) => ({
  updates: [],
  pushUpdate: (update) => {
    const existing = get().updates;
    if (existing.some((item) => item.dedupeKey === update.dedupeKey)) return;

    const entry: ArtifactUpdate = {
      ...update,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    };

    set({
      updates: [entry, ...existing].slice(0, MAX_UPDATES),
    });
  },
  dismissUpdate: (id) => {
    set({ updates: get().updates.filter((item) => item.id !== id) });
  },
}));
