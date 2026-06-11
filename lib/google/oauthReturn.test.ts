import { describe, expect, it } from "vitest";

import {

  buildOAuthReturnUrl,

  decodeOAuthReturnPayload,

  encodeOAuthReturnPayload,

  sanitizeOAuthReturnPath,

} from "@/lib/google/oauthReturn";



describe("oauthReturn", () => {

  it("rejects open-redirect paths", () => {

    expect(sanitizeOAuthReturnPath("//evil.com")).toBe("/");

    expect(sanitizeOAuthReturnPath("https://evil.com")).toBe("/");

  });



  it("round-trips return payload through encode/decode", () => {

    const raw = encodeOAuthReturnPayload({

      path: "/dev/artifact-catalog?x=1",

      intent: "picker",

      artifactId: "art-1",

    });

    expect(decodeOAuthReturnPayload(raw)).toEqual({

      path: "/dev/artifact-catalog?x=1",

      intent: "picker",

      artifactId: "art-1",

    });

  });



  it("builds return URL on the oauth-complete page with resume params", () => {

    const url = buildOAuthReturnUrl(

      "http://localhost:3000",

      { path: "/", intent: "picker", artifactId: "a1" },

      { ok: true },

    );

    expect(url).toContain("/google/oauth-complete");

    expect(url).toContain("returnTo=%2F");

    expect(url).toContain("google_connected=1");

    expect(url).toContain("google_intent=picker");

    expect(url).toContain("google_artifact_id=a1");

  });

});


