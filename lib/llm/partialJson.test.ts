import { describe, expect, it } from "vitest";
import { parsePartialJson } from "@/lib/llm/partialJson";

describe("parsePartialJson", () => {
  it("parses complete JSON as-is", () => {
    expect(parsePartialJson('{"a":1,"b":[true,null]}')).toEqual({
      a: 1,
      b: [true, null],
    });
  });

  it("returns undefined before anything usable arrives", () => {
    expect(parsePartialJson("")).toBeUndefined();
    expect(parsePartialJson("  ")).toBeUndefined();
    expect(parsePartialJson("tr")).toBeUndefined();
  });

  it("closes open containers", () => {
    expect(parsePartialJson('{"type":"table","data":{"rows":[')).toEqual({
      type: "table",
      data: { rows: [] },
    });
  });

  it("keeps a cut-off string value", () => {
    expect(parsePartialJson('{"type":"table","title":"Top cit')).toEqual({
      type: "table",
      title: "Top cit",
    });
    expect(parsePartialJson('{"rows":[{"a":"Par')).toEqual({
      rows: [{ a: "Par" }],
    });
  });

  it("drops a half-written key", () => {
    expect(parsePartialJson('{"type":"todo","ti')).toEqual({ type: "todo" });
    expect(parsePartialJson('{"type":"todo","title"')).toEqual({ type: "todo" });
    expect(parsePartialJson('{"type":"todo","title":')).toEqual({ type: "todo" });
  });

  it("drops an unterminated number or literal", () => {
    expect(parsePartialJson('{"a":[1,2,3')).toEqual({ a: [1, 2] });
    expect(parsePartialJson('{"a":tru')).toEqual({});
    expect(parsePartialJson('{"a":[1,2,3]')).toEqual({ a: [1, 2, 3] });
  });

  it("handles escapes inside strings", () => {
    expect(parsePartialJson('{"a":"say \\"hi\\" now')).toEqual({
      a: 'say "hi" now',
    });
    expect(parsePartialJson('{"a":"line\\')).toEqual({ a: "line" });
    expect(parsePartialJson('{"a":"caf\\u00')).toEqual({ a: "caf" });
  });

  it("ignores braces inside strings", () => {
    expect(parsePartialJson('{"html":"<div>{x}</div>","css":"a{col')).toEqual({
      html: "<div>{x}</div>",
      css: "a{col",
    });
  });
});
