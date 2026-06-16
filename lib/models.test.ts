import { describe, expect, it } from "vitest";
import { getModelProvider, isKnownModel, modelSupportsTools } from "@/lib/models";

describe("getModelProvider", () => {
  it("routes known Claude models to anthropic", () => {
    expect(getModelProvider("claude-sonnet-4-6")).toBe("anthropic");
  });

  it("routes known OpenRouter models to openrouter", () => {
    expect(getModelProvider("openai/gpt-4o")).toBe("openrouter");
  });

  it("falls back by heuristic for unknown ids", () => {
    expect(getModelProvider("claude-future-9")).toBe("anthropic");
    expect(getModelProvider("meta-llama/llama-4")).toBe("openrouter");
  });
});

describe("model helpers", () => {
  it("knows registered models", () => {
    expect(isKnownModel("claude-sonnet-4-6")).toBe(true);
    expect(isKnownModel("nope")).toBe(false);
  });

  it("reports tool support, defaulting to true for unknown", () => {
    expect(modelSupportsTools("deepseek/deepseek-chat")).toBe(true);
    expect(modelSupportsTools("unknown/model")).toBe(true);
  });
});
