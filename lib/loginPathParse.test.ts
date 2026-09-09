import { describe, expect, it } from "vitest";

// Plain CommonJS module shared with the Electron main process, which cannot
// import from lib/. Required rather than imported for the same reason.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  BEGIN,
  END,
  PROBE_COMMAND,
  parseProbeOutput,
  dedupePathEntries,
  augmentFallbackPath,
} = require("../electron/loginPathParse.js");

const wrap = (path: string) => `${BEGIN}${path}${END}`;
const REAL_PATH = "/opt/homebrew/bin:/usr/bin:/bin";

describe("parseProbeOutput", () => {
  it("extracts PATH from clean output", () => {
    expect(parseProbeOutput(wrap(REAL_PATH))).toBe(REAL_PATH);
  });

  // The whole reason for sentinels: interactive login shells are chatty.
  it("survives banners, MOTDs and trailing noise", () => {
    const noisy = [
      "Last login: Mon Sep  1 09:14:22 on ttys004",
      "Now using node v22.3.0 (npm v10.8.1)",
      wrap(REAL_PATH),
      "",
    ].join("\n");
    expect(parseProbeOutput(noisy)).toBe(REAL_PATH);
  });

  it("survives ANSI escapes around the sentinels", () => {
    const ansi = `\u001b[32mwelcome\u001b[0m\n${wrap(REAL_PATH)}\n\u001b[0m`;
    expect(parseProbeOutput(ansi)).toBe(REAL_PATH);
  });

  it("returns null when a sentinel is missing or the pair is inverted", () => {
    expect(parseProbeOutput(`${BEGIN}${REAL_PATH}`)).toBeNull();
    expect(parseProbeOutput(`${REAL_PATH}${END}`)).toBeNull();
    expect(parseProbeOutput("shell exploded")).toBeNull();
    expect(parseProbeOutput(`${END}${REAL_PATH}${BEGIN}`)).toBeNull();
  });

  it("returns null for an empty or whitespace-only PATH", () => {
    expect(parseProbeOutput(wrap(""))).toBeNull();
    expect(parseProbeOutput(wrap("   \n  "))).toBeNull();
  });

  it("returns null for non-string input", () => {
    expect(parseProbeOutput(undefined)).toBeNull();
    expect(parseProbeOutput(null)).toBeNull();
    expect(parseProbeOutput(Buffer.from("x"))).toBeNull();
  });

  it("uses `command echo` so a shadowed echo cannot break the probe", () => {
    expect(PROBE_COMMAND).toContain("command echo");
  });

  // Regression: bare $PATH__FLOWSTATE_PATH_END__ parses as a variable NAMED
  // PATH__FLOWSTATE_PATH_END__ and expands to nothing, so the probe silently
  // yields no sentinel and every user drops to the fallback path.
  it("braces the variable so the sentinel is not absorbed into its name", () => {
    expect(PROBE_COMMAND).toContain("${PATH}");
    expect(PROBE_COMMAND).not.toMatch(/\$PATH[A-Za-z0-9_]/);
  });
});

describe("dedupePathEntries", () => {
  it("drops duplicates and empties, keeping first-seen order", () => {
    expect(dedupePathEntries("/a:/b:/a::/c:/b")).toEqual(["/a", "/b", "/c"]);
  });

  it("handles empty and non-string input", () => {
    expect(dedupePathEntries("")).toEqual([]);
    expect(dedupePathEntries(undefined)).toEqual([]);
  });
});

describe("augmentFallbackPath", () => {
  const LAUNCHD = "/usr/bin:/bin:/usr/sbin:/sbin";
  const exists = (present: string[]) => (dir: string) => present.includes(dir);

  it("prepends only directories that exist", () => {
    const result = augmentFallbackPath(
      LAUNCHD,
      exists(["/opt/homebrew/bin", "/usr/local/bin"]),
      "/Users/ravi",
    );
    expect(result.split(":")).toEqual([
      "/opt/homebrew/bin",
      "/usr/local/bin",
      "/usr/bin",
      "/bin",
      "/usr/sbin",
      "/sbin",
    ]);
    expect(result).not.toContain("/opt/homebrew/sbin");
  });

  it("keeps nvm dirs in the order given (caller sorts newest first)", () => {
    const nvm = ["/Users/ravi/.nvm/versions/node/v22.3.0/bin"];
    const result = augmentFallbackPath(LAUNCHD, exists(nvm), "/Users/ravi", nvm);
    expect(result.split(":")[0]).toBe(nvm[0]);
  });

  it("does not duplicate an entry already on PATH", () => {
    const result = augmentFallbackPath(
      `/opt/homebrew/bin:${LAUNCHD}`,
      exists(["/opt/homebrew/bin"]),
      "/Users/ravi",
    );
    expect(result.split(":").filter((d: string) => d === "/opt/homebrew/bin")).toHaveLength(1);
  });

  it("returns the original PATH when nothing extra exists", () => {
    expect(augmentFallbackPath(LAUNCHD, () => false, "/Users/ravi")).toBe(LAUNCHD);
  });

  // A throwing existsSync (permissions, a race) must not take down boot.
  it("survives an existsSync that throws", () => {
    const result = augmentFallbackPath(
      LAUNCHD,
      () => {
        throw new Error("EPERM");
      },
      "/Users/ravi",
    );
    expect(result).toBe(LAUNCHD);
  });
});
