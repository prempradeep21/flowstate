import { describe, expect, it } from "vitest";
import {
  classifyLocalSupabaseSafety,
  getSupabaseProjectRef,
} from "@/lib/supabase/environment";

describe("getSupabaseProjectRef", () => {
  it("parses standard Supabase URLs", () => {
    expect(
      getSupabaseProjectRef("https://fralwrnjutaoqvozujgp.supabase.co"),
    ).toBe("fralwrnjutaoqvozujgp");
  });
});

describe("classifyLocalSupabaseSafety", () => {
  it("flags production env on localhost", () => {
    expect(
      classifyLocalSupabaseSafety("localhost", {
        deploymentEnv: "production",
        projectRef: "abc123",
        supabaseConfigured: true,
      }),
    ).toEqual({ kind: "prod_on_localhost", projectRef: "abc123" });
  });

  it("accepts dev env with a non-prod project ref", () => {
    expect(
      classifyLocalSupabaseSafety("localhost", {
        deploymentEnv: "dev",
        projectRef: "devproject",
        prodProjectRef: "prodproject",
        supabaseConfigured: true,
      }),
    ).toEqual({ kind: "dev_ok", projectRef: "devproject" });
  });

  it("rejects dev env when project ref still matches production", () => {
    expect(
      classifyLocalSupabaseSafety("localhost", {
        deploymentEnv: "dev",
        projectRef: "prodproject",
        prodProjectRef: "prodproject",
        supabaseConfigured: true,
      }),
    ).toEqual({
      kind: "dev_misconfigured",
      projectRef: "prodproject",
      prodProjectRef: "prodproject",
    });
  });

  it("ignores non-local hosts", () => {
    expect(
      classifyLocalSupabaseSafety("app.example.com", {
        deploymentEnv: "production",
        projectRef: "abc123",
        supabaseConfigured: true,
      }),
    ).toEqual({ kind: "not_local" });
  });
});
