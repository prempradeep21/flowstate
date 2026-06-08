import { describe, expect, it } from "vitest";
import {
  formatPersistenceError,
  isRetryableSaveError,
  isStatementTimeoutError,
  withSaveRetry,
} from "@/lib/canvasSaveRetry";

describe("canvasSaveRetry", () => {
  it("formats PostgREST-style errors", () => {
    const msg = formatPersistenceError({
      message: "Payload too large",
      code: "PGRST116",
      details: "row limit",
    });
    expect(msg).toContain("Payload too large");
    expect(msg).toContain("PGRST116");
  });

  it("retries transient failures", async () => {
    let attempts = 0;
    const result = await withSaveRetry(async () => {
      attempts += 1;
      if (attempts < 2) {
        throw new Error("network timeout");
      }
      return "ok";
    }, { baseDelayMs: 1 });

    expect(result).toBe("ok");
    expect(attempts).toBe(2);
  });

  it("does not retry non-transient failures", async () => {
    let attempts = 0;
    await expect(
      withSaveRetry(async () => {
        attempts += 1;
        throw new Error("permission denied");
      }, { baseDelayMs: 1 }),
    ).rejects.toThrow("permission denied");
    expect(attempts).toBe(1);
  });

  it("does not retry Postgres statement timeouts", async () => {
    let attempts = 0;
    await expect(
      withSaveRetry(async () => {
        attempts += 1;
        throw {
          message: "canceling statement due to statement timeout",
          code: "57014",
        };
      }, { baseDelayMs: 1 }),
    ).rejects.toMatchObject({ code: "57014" });
    expect(attempts).toBe(1);
  });

  it("classifies statement timeout errors", () => {
    expect(
      isStatementTimeoutError({
        code: "57014",
        message: "canceling statement due to statement timeout",
      }),
    ).toBe(true);
  });
});
