import { describe, expect, it } from "vitest";
import { highlightCode, languageFromPath } from "@/lib/codeHighlight";

describe("highlightCode", () => {
  it("does not re-highlight the class attribute of an emitted span", () => {
    // A second pass used to match the keyword `class` inside `class="…"`,
    // emitting `<span <span …>class</span>="…">` and leaking markup as text.
    const html = highlightCode("run on `flowstate2` now", "markdown");
    expect(html).not.toContain("<span <span");
    expect(html).not.toContain('>class</span>=');
  });

  it("highlights strings and keywords in code without nesting tags", () => {
    const html = highlightCode('const label = "hello";', "typescript");
    expect(html).toContain("text-canvas-syntaxKeyword");
    expect(html).toContain("text-canvas-syntaxString");
    expect(html).not.toContain("<span <span");
  });

  it("leaves prose words alone in markdown", () => {
    const html = highlightCode("Return the type of interface you need", "markdown");
    expect(html).not.toContain("text-canvas-syntaxKeyword");
    expect(html).toBe("Return the type of interface you need");
  });

  it("escapes HTML in the source", () => {
    expect(highlightCode("<b>hi</b>", "plaintext")).toBe("&lt;b&gt;hi&lt;/b&gt;");
  });

  it("maps markdown files to the markdown language", () => {
    expect(languageFromPath("mcp-backlog.md")).toBe("markdown");
  });
});
