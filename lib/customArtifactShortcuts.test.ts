import { describe, expect, it } from "vitest";
import {
  htmlDocumentToCustomData,
  tryImportAttachedHtmlAsCustom,
  trySimpleCustomEdit,
} from "@/lib/customArtifactShortcuts";

const SAMPLE_HTML = `<!DOCTYPE html>
<html><head><style>.box { color: red; }</style></head>
<body><div class="box">Hello</div>
<script>console.log("hi")</script></body></html>`;

describe("customArtifactShortcuts", () => {
  it("parses HTML documents into custom artifact data", () => {
    const data = htmlDocumentToCustomData(SAMPLE_HTML);
    expect(data?.html).toContain("Hello");
    expect(data?.css).toContain(".box");
    expect(data?.js).toContain('console.log("hi")');
  });

  it("applies monochrome theme without LLM", () => {
    const base = {
      type: "custom" as const,
      title: "Widget",
      data: { html: "<div>Hi</div>", css: ".x{color:red}", js: "void 0" },
    };
    const next = trySimpleCustomEdit(base, "make it black and white theme");
    expect(next?.data.css).toContain("grayscale");
    expect(next?.data.html).toBe(base.data.html);
    expect(next?.data.js).toBe(base.data.js);
  });

  it("imports attached HTML when user asks to run it as custom UI", () => {
    const question = `run this HTML in a custom HTML UI

Attached asset context:

Asset: demo.html (text/html)
${SAMPLE_HTML}`;

    const imported = tryImportAttachedHtmlAsCustom(question);
    expect(imported?.type).toBe("custom");
    expect(imported?.data.html).toContain("Hello");
  });
});
