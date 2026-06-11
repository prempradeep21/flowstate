import { describe, expect, it } from "vitest";

import { friendlyGoogleOAuthError } from "@/lib/google/oauthMessages";



describe("friendlyGoogleOAuthError", () => {

  it("explains missing google_connections table", () => {

    const msg = friendlyGoogleOAuthError(

      "Failed to store Google connection: Could not find the table 'public.google_connections' in the schema cache",

    );

    expect(msg).toContain("google_connections");

    expect(msg).toContain("migration");

  });

});


