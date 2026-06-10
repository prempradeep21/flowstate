import { describe, expect, it } from "vitest";
import {
  countryCodeToFlagEmoji,
  formatRichTextForDisplay,
  withEmojiFontFamily,
} from "@/lib/richTextDisplay";

describe("countryCodeToFlagEmoji", () => {
  it("converts ISO codes to regional-indicator flags", () => {
    expect(countryCodeToFlagEmoji("us")).toBe("🇺🇸");
    expect(countryCodeToFlagEmoji("SA")).toBe("🇸🇦");
    expect(countryCodeToFlagEmoji("tw")).toBe("🇹🇼");
  });

  it("rejects invalid codes", () => {
    expect(countryCodeToFlagEmoji("usa")).toBeNull();
    expect(countryCodeToFlagEmoji("1")).toBeNull();
  });
});

describe("formatRichTextForDisplay", () => {
  it("prefixes leading country codes with flags", () => {
    expect(formatRichTextForDisplay("us USA")).toBe("🇺🇸 USA");
    expect(formatRichTextForDisplay("sa Saudi Arabia")).toBe("🇸🇦 Saudi Arabia");
    expect(formatRichTextForDisplay("tw Taiwan")).toBe("🇹🇼 Taiwan");
  });

  it("expands flag shortcodes", () => {
    expect(formatRichTextForDisplay(":flag_us: United States")).toBe(
      "🇺🇸 United States",
    );
    expect(formatRichTextForDisplay(":flag-sa: Saudi Arabia")).toBe(
      "🇸🇦 Saudi Arabia",
    );
  });

  it("preserves existing emoji and special characters", () => {
    expect(formatRichTextForDisplay("🇺🇸 USA")).toBe("🇺🇸 USA");
    expect(formatRichTextForDisplay("~$3.5T")).toBe("~$3.5T");
    expect(formatRichTextForDisplay("€12.5M • ↑ 4%")).toBe("€12.5M • ↑ 4%");
  });

  it("does not rewrite common non-country shortcodes", () => {
    expect(formatRichTextForDisplay(":ok: looks good")).toBe(":ok: looks good");
  });
});

describe("withEmojiFontFamily", () => {
  it("appends emoji fallbacks once", () => {
    expect(withEmojiFontFamily("Satoshi")).toContain("Satoshi");
    expect(withEmojiFontFamily("Satoshi")).toContain("Segoe UI Emoji");
    expect(withEmojiFontFamily(withEmojiFontFamily("Satoshi"))).not.toContain(
      "Segoe UI Emoji, Segoe UI Emoji",
    );
  });
});
