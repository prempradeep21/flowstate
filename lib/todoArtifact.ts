import type {
  ArtifactPayload,
  TodoArtifactData,
  TodoItem,
  TodoPriority,
} from "@/lib/artifactTypes";

/** Source card id for user-initiated saves (no chat turn). */
export const MANUAL_TODO_SOURCE_CARD_ID = "__manual__";

const PRIORITIES: TodoPriority[] = ["low", "medium", "high"];

function newTodoItemId(): string {
  return `todo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Ensure every item has a unique id (AI sometimes emits duplicate slug ids). */
export function ensureUniqueTodoItemIds(items: TodoItem[]): TodoItem[] {
  const seen = new Set<string>();
  return items.map((item) => {
    if (item.id && !seen.has(item.id)) {
      seen.add(item.id);
      return item;
    }
    const id = newTodoItemId();
    seen.add(id);
    return { ...item, id };
  });
}

function normalizePriority(value: unknown): TodoPriority | undefined {
  if (typeof value !== "string") return undefined;
  const lower = value.toLowerCase() as TodoPriority;
  return PRIORITIES.includes(lower) ? lower : undefined;
}

function normalizeDueDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  return new Date(parsed).toISOString().slice(0, 10);
}

export function normalizeTodoItem(raw: unknown, fallbackId?: string): TodoItem {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const label = typeof obj.label === "string" ? obj.label.trim() : "";
  return {
    id:
      typeof obj.id === "string" && obj.id.trim()
        ? obj.id.trim()
        : (fallbackId ?? newTodoItemId()),
    label,
    checked: Boolean(obj.checked),
    dueDate: normalizeDueDate(obj.dueDate),
    priority: normalizePriority(obj.priority),
  };
}

export function normalizeTodoArtifactData(data: unknown): TodoArtifactData {
  const obj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const itemsRaw = Array.isArray(obj.items) ? obj.items : [];
  return {
    items: ensureUniqueTodoItemIds(
      itemsRaw.map((item) => normalizeTodoItem(item)),
    ),
  };
}

export function normalizeTodoPayload(
  payload: Extract<ArtifactPayload, { type: "todo" }>,
): Extract<ArtifactPayload, { type: "todo" }> {
  return {
    ...payload,
    data: normalizeTodoArtifactData(payload.data),
  };
}

export function createEmptyTodoPayload(
  title = "Untitled list",
): Extract<ArtifactPayload, { type: "todo" }> {
  return {
    type: "todo",
    title: title.trim() || "Untitled list",
    data: { items: [] },
  };
}

/** Preserve stable item ids when AI emits items without ids. */
export function mergeTodoItemsFromAi(
  previous: TodoItem[],
  incoming: TodoItem[],
): TodoItem[] {
  const prevById = new Map(previous.map((item) => [item.id, item]));
  const prevByLabel = new Map<string, TodoItem[]>();

  for (const item of previous) {
    const key = item.label.toLowerCase();
    const list = prevByLabel.get(key) ?? [];
    list.push(item);
    prevByLabel.set(key, list);
  }

  const usedPrevIds = new Set<string>();
  const usedIncomingIds = new Set<string>();

  const merged = incoming.map((raw, index) => {
    if (raw.id && prevById.has(raw.id) && !usedPrevIds.has(raw.id)) {
      usedPrevIds.add(raw.id);
      usedIncomingIds.add(raw.id);
      return { ...raw, id: raw.id };
    }

    const labelMatches = prevByLabel.get(raw.label.toLowerCase()) ?? [];
    const match = labelMatches.find((item) => !usedPrevIds.has(item.id));
    if (match) {
      usedPrevIds.add(match.id);
      usedIncomingIds.add(match.id);
      return { ...raw, id: match.id };
    }

    if (raw.id && !usedIncomingIds.has(raw.id)) {
      usedIncomingIds.add(raw.id);
      return { ...raw, id: raw.id };
    }

    const positional = previous[index];
    if (positional && !usedPrevIds.has(positional.id)) {
      usedPrevIds.add(positional.id);
      usedIncomingIds.add(positional.id);
      return { ...raw, id: positional.id };
    }

    const id = newTodoItemId();
    usedIncomingIds.add(id);
    return { ...raw, id };
  });

  return ensureUniqueTodoItemIds(merged);
}

export function todoCompletionStats(items: TodoItem[]): {
  done: number;
  total: number;
} {
  const total = items.length;
  const done = items.filter((item) => item.checked).length;
  return { done, total };
}

export function todoCompletionLabel(items: TodoItem[]): string | null {
  const { done, total } = todoCompletionStats(items);
  if (total === 0) return "No items";
  return `${done}/${total} done`;
}

export function createTodoItem(label = ""): TodoItem {
  return {
    id: newTodoItemId(),
    label,
    checked: false,
  };
}

/** Deep-clone payload for draft editing. */
export function cloneTodoPayload(
  payload: Extract<ArtifactPayload, { type: "todo" }>,
): Extract<ArtifactPayload, { type: "todo" }> {
  return {
    type: "todo",
    title: payload.title,
    description: payload.description,
    data: {
      items: payload.data.items.map((item) => ({ ...item })),
    },
  };
}
