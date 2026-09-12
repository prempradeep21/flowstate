import { describe, expect, it } from "vitest";
import { isElectronUserAgent } from "@/lib/desktopRuntime";

describe("isElectronUserAgent", () => {
  // Captured from a real Electron 33 renderer in this repo.
  const ELECTRON_UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/130.0.6723.191 Electron/33.4.11 Safari/537.36";
  const CHROME_UA =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

  it("detects the desktop app", () => {
    expect(isElectronUserAgent(ELECTRON_UA)).toBe(true);
  });

  it("does not fire for a plain browser", () => {
    expect(isElectronUserAgent(CHROME_UA)).toBe(false);
    expect(isElectronUserAgent(undefined)).toBe(false);
    expect(isElectronUserAgent("")).toBe(false);
  });

  // "Electron" must be a product token, not any occurrence of the word.
  it("is not fooled by the word appearing elsewhere", () => {
    expect(isElectronUserAgent("Mozilla/5.0 ElectronicBrowser/1.0")).toBe(false);
    expect(isElectronUserAgent("Mozilla/5.0 (Electron enthusiast)")).toBe(false);
  });
});
