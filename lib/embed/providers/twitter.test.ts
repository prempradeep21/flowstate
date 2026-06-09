import { describe, expect, it } from "vitest";
import { twitterProvider } from "@/lib/embed/providers/twitter";

describe("twitterProvider", () => {
  it("always returns the official Twitter embed iframe", async () => {
    const url = new URL("https://x.com/sama/status/551911584828071936");
    const result = await twitterProvider.resolve(url);

    expect(result.iframeSrc).toBe(
      "https://platform.twitter.com/embed/Tweet.html?id=551911584828071936&dnt=true",
    );
    expect(result.embedHtml).toBeUndefined();
    expect(result.embedWidth).toBe(550);
  });
});
