import { describe, expect, it } from "vitest";
import {
  createEmptyTodoPayload,
  mergeTodoItemsFromAi,
  normalizeTodoArtifactData,
  normalizeTodoItem,
  todoCompletionLabel,
} from "@/lib/todoArtifact";

describe("normalizeTodoItem", () => {
  it("assigns id and trims label", () => {
    const item = normalizeTodoItem({ label: "  Buy milk  ", checked: true });
    expect(item.label).toBe("Buy milk");
    expect(item.checked).toBe(true);
    expect(item.id).toBeTruthy();
  });

  it("parses priority and due date", () => {
    const item = normalizeTodoItem({
      label: "Task",
      priority: "HIGH",
      dueDate: "2026-06-07",
    });
    expect(item.priority).toBe("high");
    expect(item.dueDate).toBe("2026-06-07");
  });
});

describe("normalizeTodoArtifactData", () => {
  it("normalizes item array", () => {
    const data = normalizeTodoArtifactData({
      items: [{ label: "One" }, { label: "Two", checked: true }],
    });
    expect(data.items).toHaveLength(2);
    expect(data.items[1].checked).toBe(true);
  });
});

describe("mergeTodoItemsFromAi", () => {
  it("preserves ids by label match", () => {
    const previous = [
      normalizeTodoItem({ id: "a1", label: "Alpha", checked: false }),
      normalizeTodoItem({ id: "b1", label: "Beta", checked: true }),
    ];
    const incoming = [
      normalizeTodoItem({ label: "Alpha", checked: true }),
      normalizeTodoItem({ label: "Beta", checked: true }),
    ];
    const merged = mergeTodoItemsFromAi(previous, incoming);
    expect(merged[0].id).toBe("a1");
    expect(merged[0].checked).toBe(true);
    expect(merged[1].id).toBe("b1");
  });
});

describe("todoCompletionLabel", () => {
  it("returns completion fraction", () => {
    const label = todoCompletionLabel([
      normalizeTodoItem({ label: "A", checked: true }),
      normalizeTodoItem({ label: "B", checked: false }),
    ]);
    expect(label).toBe("1/2 done");
  });
});

describe("createEmptyTodoPayload", () => {
  it("creates empty list with title", () => {
    const payload = createEmptyTodoPayload("My list");
    expect(payload.type).toBe("todo");
    expect(payload.title).toBe("My list");
    expect(payload.data.items).toEqual([]);
  });
});
