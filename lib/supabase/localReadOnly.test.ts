import { describe, expect, it } from "vitest";
import { isLocalReadOnlyClient } from "@/lib/supabase/localReadOnly";

describe("isLocalReadOnlyClient", () => {
  it("defaults to read-only on localhost", () => {
    expect(isLocalReadOnlyClient("localhost")).toBe(true);
    expect(isLocalReadOnlyClient("127.0.0.1")).toBe(true);
  });

  it("is false on non-local hosts", () => {
    expect(isLocalReadOnlyClient("app.example.com")).toBe(false);
  });

  it("respects NEXT_PUBLIC_LOCAL_READ_ONLY=false", () => {
    const prev = process.env.NEXT_PUBLIC_LOCAL_READ_ONLY;
    process.env.NEXT_PUBLIC_LOCAL_READ_ONLY = "false";
    expect(isLocalReadOnlyClient("localhost")).toBe(false);
    process.env.NEXT_PUBLIC_LOCAL_READ_ONLY = prev;
  });
});
