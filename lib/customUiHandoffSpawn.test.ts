import { describe, expect, it } from "vitest";
import { buildCustomUiHandoffFollowUp } from "@/lib/customUiHandoffSpawn";
import { sanitizeCustomUiSource } from "@/lib/customUiSource";
import { detectCustomUiIntent, isCustomUiWork } from "@/lib/artifactIntent";

const source = sanitizeCustomUiSource({
  serverName: "memory",
  toolName: "read_graph",
  brief: "Let them explore how entities connect.",
  text: '{"entities":[{"name":"Flowstate"}]}',
})!;

const handoff = { title: "Knowledge graph explorer", source };

describe("buildCustomUiHandoffFollowUp", () => {
  it("reads as a human-legible request naming the source server", () => {
    const { question } = buildCustomUiHandoffFollowUp(handoff);
    expect(question).toContain("Knowledge graph explorer");
    expect(question).toContain("memory");
  });

  // The seed path forces past the gate, but the label/thinking heuristics still
  // read this question, so it must look like custom-UI work on its own.
  it("satisfies the custom-UI intent check", () => {
    const { question } = buildCustomUiHandoffFollowUp(handoff);
    expect(detectCustomUiIntent(question)).toBe(true);
    expect(isCustomUiWork(question, null)).toBe(true);
  });

  // The question is user-visible and feeds ancestor history on later turns —
  // the payload must travel out-of-band.
  it("keeps the payload out of the question", () => {
    const { question, options } = buildCustomUiHandoffFollowUp(handoff);
    expect(question).not.toContain(source.text);
    expect(question).not.toContain("entities");
    expect(options.customUiSource).toBe(source);
  });
});
