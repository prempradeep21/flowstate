import { describe, expect, it } from "vitest";
import {
  getCursorSdkRuntimeIssue,
  isConnectOrNetworkError,
  isNodeVersionSupportedForCursorSdk,
  shouldFallbackFromCursorSdk,
} from "@/lib/cursorSdk/runtimeCheck";

describe("isNodeVersionSupportedForCursorSdk", () => {
  it("accepts Node 20.4+", () => {
    expect(isNodeVersionSupportedForCursorSdk("20.4.0")).toBe(true);
    expect(isNodeVersionSupportedForCursorSdk("22.1.0")).toBe(true);
  });

  it("rejects Node 20.2", () => {
    expect(isNodeVersionSupportedForCursorSdk("20.2.0")).toBe(false);
  });
});

describe("getCursorSdkRuntimeIssue", () => {
  it("reports missing API key", () => {
    const prev = process.env.CURSOR_API_KEY;
    delete process.env.CURSOR_API_KEY;
    expect(getCursorSdkRuntimeIssue()?.code).toBe("missing_api_key");
    process.env.CURSOR_API_KEY = prev;
  });
});

describe("isConnectOrNetworkError", () => {
  it("matches socket timeout errors", () => {
    expect(
      isConnectOrNetworkError(
        "ConnectError: [internal] Socket connection timeout",
      ),
    ).toBe(true);
  });
});

describe("shouldFallbackFromCursorSdk", () => {
  it("returns true for network errors when Anthropic key exists", () => {
    const prev = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = "test-key";
    expect(
      shouldFallbackFromCursorSdk(
        new Error("ConnectError: [internal] Socket connection timeout"),
      ),
    ).toBe(true);
    process.env.ANTHROPIC_API_KEY = prev;
  });
});
