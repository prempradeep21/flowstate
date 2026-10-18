/**
 * Best-effort parse of a JSON document that is still being streamed.
 *
 * Returns the largest valid prefix with every open container closed, so a
 * tool input like `{"type":"table","data":{"rows":[{"a":"Par` reads as
 * `{ type: "table", data: { rows: [{ a: "Par" }] } }`. A string value that is
 * cut off mid-way is kept (closed where it stops); a half-written key, number
 * or literal is dropped back to the last complete value. Returns undefined
 * when nothing usable has arrived yet.
 */

type Context =
  | { t: "object"; s: "key" | "colon" | "value" | "comma" }
  | { t: "array"; s: "value" | "comma" };

export function parsePartialJson(text: string): unknown {
  const src = text.trim();
  if (!src) return undefined;
  try {
    return JSON.parse(src);
  } catch {
    // still streaming — fall through to the tolerant scan
  }

  const stack: Context[] = [];
  const closers = () =>
    stack
      .map((c) => (c.t === "object" ? "}" : "]"))
      .reverse()
      .join("");

  let safeEnd = -1;
  let safeClose = "";
  const markSafe = (end: number) => {
    safeEnd = end;
    safeClose = closers();
  };
  const valueDone = () => {
    const top = stack[stack.length - 1];
    if (top) top.s = "comma";
  };

  let inString = false;
  let stringIsKey = false;
  let i = 0;

  while (i < src.length) {
    const ch = src[i];

    if (inString) {
      if (ch === "\\") {
        i += 2;
        continue;
      }
      if (ch === '"') {
        inString = false;
        const top = stack[stack.length - 1];
        if (stringIsKey) {
          if (top?.t === "object") top.s = "colon";
        } else {
          valueDone();
          markSafe(i + 1);
        }
      }
      i += 1;
      continue;
    }

    if (ch === " " || ch === "\n" || ch === "\r" || ch === "\t") {
      i += 1;
      continue;
    }

    const top = stack[stack.length - 1];
    if (ch === "{") {
      stack.push({ t: "object", s: "key" });
      markSafe(i + 1);
    } else if (ch === "[") {
      stack.push({ t: "array", s: "value" });
      markSafe(i + 1);
    } else if (ch === "}" || ch === "]") {
      stack.pop();
      valueDone();
      markSafe(i + 1);
    } else if (ch === ",") {
      if (top) top.s = top.t === "object" ? "key" : "value";
    } else if (ch === ":") {
      if (top?.t === "object") top.s = "value";
    } else if (ch === '"') {
      inString = true;
      stringIsKey = top?.t === "object" && top.s === "key";
    } else {
      // Number or literal: only trust it once something follows it.
      let j = i;
      while (j < src.length && !/[\s,\]}:]/.test(src[j])) j += 1;
      if (j >= src.length) break;
      valueDone();
      markSafe(j);
      i = j;
      continue;
    }
    i += 1;
  }

  let candidate: string | null = null;
  if (inString && !stringIsKey) {
    // Keep the cut-off string value: drop a dangling escape, then close it.
    let body = src.replace(/\\u[0-9a-fA-F]{0,3}$/, "");
    const trailingSlashes = body.match(/\\+$/)?.[0].length ?? 0;
    if (trailingSlashes % 2 === 1) body = body.slice(0, -1);
    candidate = `${body}"${closers()}`;
  } else if (safeEnd >= 0) {
    candidate = src.slice(0, safeEnd) + safeClose;
  }
  if (candidate == null) return undefined;

  try {
    return JSON.parse(candidate);
  } catch {
    if (safeEnd < 0) return undefined;
    try {
      return JSON.parse(src.slice(0, safeEnd) + safeClose);
    } catch {
      return undefined;
    }
  }
}
