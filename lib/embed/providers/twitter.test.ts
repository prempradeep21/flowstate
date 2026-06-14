import { describe, expect, it } from "vitest";
import {
  parseTwitterScreenName,
  parseTweetId,
  twitterProvider,
} from "@/lib/embed/providers/twitter";

describe("twitterProvider", () => {
  it("always returns the official Twitter embed iframe for tweets", async () => {
    const url = new URL("https://x.com/sama/status/551911584828071936");
    const result = await twitterProvider.resolve(url);

    expect(result.iframeSrc).toBe(
      "https://platform.twitter.com/embed/Tweet.html?id=551911584828071936&dnt=true",
    );
    expect(result.embedHtml).toBeUndefined();
    expect(result.embedWidth).toBe(550);
  });

  it("matches profile URLs", () => {
    expect(
      twitterProvider.match(new URL("https://x.com/elonmusk")),
    ).toBe(true);
    expect(parseTwitterScreenName(new URL("https://x.com/elonmusk"))).toBe(
      "elonmusk",
    );
  });

  it("returns timeline iframe for profile URLs", async () => {
    const url = new URL("https://x.com/elonmusk");
    const result = await twitterProvider.resolve(url);
    expect(result.iframeSrc).toBe(
      "https://platform.twitter.com/embed/Timeline.html?screenName=elonmusk&dnt=true",
    );
    expect(result.embedHeight).toBe(600);
  });

  it("does not treat tweet URLs as profiles", () => {
    const url = new URL("https://x.com/sama/status/551911584828071936");
    expect(parseTweetId(url)).toBe("551911584828071936");
    expect(parseTwitterScreenName(url)).toBeNull();
  });
});
