import { describe, expect, it } from "vitest";
import { detectTodoListIntent } from "@/lib/artifactIntent";

describe("detectTodoListIntent", () => {
  it("detects explicit todo list requests", () => {
    expect(
      detectTodoListIntent(
        "create a todo list for my visa appointment to london",
      ),
    ).toBe(true);
  });

  it("detects checklist phrasing", () => {
    expect(detectTodoListIntent("give me a checklist of things to pack")).toBe(
      true,
    );
  });

  it("detects todo artifact phrasing", () => {
    expect(
      detectTodoListIntent("create the todo list artifact with 10 items"),
    ).toBe(true);
  });

  it("ignores unrelated questions", () => {
    expect(detectTodoListIntent("what is the history of london?")).toBe(false);
  });
});
