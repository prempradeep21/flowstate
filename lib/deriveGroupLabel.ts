import { getThreadTitle, type ChatThreadState } from "@/lib/chatThreads";

const MAX_LABEL_LEN = 52;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/** Short label for a new group from the selected thread families' questions. */
export function deriveGroupLabel(
  state: ChatThreadState,
  familyRootThreadIds: string[],
): string {
  const titles = familyRootThreadIds
    .map((id) => getThreadTitle(state, id).trim())
    .filter((t) => t.length > 0 && t !== "New chat");

  if (titles.length === 0) {
    return familyRootThreadIds.length === 1
      ? "New group"
      : `${familyRootThreadIds.length} threads`;
  }

  if (titles.length === 1) {
    return truncate(titles[0], MAX_LABEL_LEN);
  }

  if (titles.length === 2) {
    const combined = `${truncate(titles[0], 24)} & ${truncate(titles[1], 24)}`;
    return truncate(combined, MAX_LABEL_LEN);
  }

  return truncate(`${titles[0]} + ${titles.length - 1} more`, MAX_LABEL_LEN);
}
