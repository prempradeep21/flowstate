import { describe, expect, it } from "vitest";
import { isFrameableFromHeaders } from "@/lib/frameability";

function headers(init: Record<string, string>): Headers {
  return new Headers(init);
}

describe("isFrameableFromHeaders", () => {
  it("treats a page with no relevant headers as frameable", () => {
    expect(isFrameableFromHeaders(headers({}))).toBe(true);
    expect(
      isFrameableFromHeaders(headers({ "content-type": "text/html" })),
    ).toBe(true);
  });

  it("blocks X-Frame-Options DENY / SAMEORIGIN (case-insensitive)", () => {
    expect(isFrameableFromHeaders(headers({ "x-frame-options": "DENY" }))).toBe(
      false,
    );
    expect(
      isFrameableFromHeaders(headers({ "x-frame-options": "SameOrigin" })),
    ).toBe(false);
  });

  it("blocks CSP frame-ancestors 'none'", () => {
    expect(
      isFrameableFromHeaders(
        headers({ "content-security-policy": "frame-ancestors 'none'" }),
      ),
    ).toBe(false);
  });

  it("blocks CSP frame-ancestors limited to specific origins", () => {
    expect(
      isFrameableFromHeaders(
        headers({
          "content-security-policy":
            "default-src 'self'; frame-ancestors https://trusted.example.com",
        }),
      ),
    ).toBe(false);
    expect(
      isFrameableFromHeaders(
        headers({ "content-security-policy": "frame-ancestors 'self'" }),
      ),
    ).toBe(false);
  });

  it("allows CSP frame-ancestors with a wildcard", () => {
    expect(
      isFrameableFromHeaders(
        headers({ "content-security-policy": "frame-ancestors *" }),
      ),
    ).toBe(true);
    expect(
      isFrameableFromHeaders(
        headers({ "content-security-policy": "frame-ancestors https://*" }),
      ),
    ).toBe(true);
  });

  it("ignores CSP without a frame-ancestors directive", () => {
    expect(
      isFrameableFromHeaders(
        headers({ "content-security-policy": "default-src 'self'; img-src *" }),
      ),
    ).toBe(true);
  });

  it("blocks when either header is restrictive", () => {
    expect(
      isFrameableFromHeaders(
        headers({
          "x-frame-options": "DENY",
          "content-security-policy": "frame-ancestors *",
        }),
      ),
    ).toBe(false);
  });
});
