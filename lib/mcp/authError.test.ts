import { describe, expect, it } from "vitest";
import { isAuthRequiredError } from "@/lib/mcp/client";

describe("isAuthRequiredError", () => {
  it("treats the SDK's typed UnauthorizedError as auth-required", () => {
    const err = new Error("unauthorized");
    err.name = "UnauthorizedError";
    expect(isAuthRequiredError(err)).toBe(true);
  });

  it("treats a structured 401/403 status field as auth-required", () => {
    expect(isAuthRequiredError({ code: 401 })).toBe(true);
    expect(isAuthRequiredError({ status: 403 })).toBe(true);
    expect(isAuthRequiredError({ statusCode: 401 })).toBe(true);
  });

  it("treats an explicit HTTP-status message as auth-required", () => {
    expect(isAuthRequiredError(new Error("HTTP 401"))).toBe(true);
    expect(isAuthRequiredError(new Error("Non-200 status code (403)"))).toBe(true);
    expect(isAuthRequiredError(new Error("401 Unauthorized"))).toBe(true);
  });

  it("does NOT flip a working server from a bare 4xx buried in prose", () => {
    // Regression: a tool result or error mentioning "401" incidentally must
    // not classify the server as needs-auth.
    expect(
      isAuthRequiredError(new Error("Fetched 401 rows from the dataset")),
    ).toBe(false);
    expect(
      isAuthRequiredError(new Error("Product SKU 403 is out of stock")),
    ).toBe(false);
    expect(isAuthRequiredError({ code: 200 })).toBe(false);
    expect(isAuthRequiredError(new Error("something went wrong"))).toBe(false);
  });
});
