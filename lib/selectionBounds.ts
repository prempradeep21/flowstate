import { computeGroupBounds, type GroupBounds } from "@/lib/groupBounds";
import type { ChatThreadState } from "@/lib/chatThreads";
import type { BranchGroup } from "@/lib/store";

export type { GroupBounds };

/** Axis-aligned bounds of all cards in the currently selected thread families. */
export function computeSelectionBounds(
  state: ChatThreadState,
  familyRootThreadIds: string[],
): GroupBounds | null {
  if (familyRootThreadIds.length === 0) return null;

  const pseudoGroup: BranchGroup = {
    id: "__selection__",
    label: "",
    familyRootThreadIds,
    summaryMarkdown: null,
  };

  return computeGroupBounds(state, pseudoGroup);
}
