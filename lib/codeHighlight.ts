/** Lightweight syntax highlighting for code artifacts (no extra deps). */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const KEYWORDS =
  "def|class|if|elif|else|return|import|from|const|let|var|function|async|await|export|default|interface|type|enum|struct|public|private|void|int|float|bool|string|new|try|catch|finally|for|while|switch|case|break|continue|extends|implements|package|using|namespace|template|typename";

/**
 * One pass over the escaped line: strings and keywords are matched together so
 * the `class="…"` attributes of an already-emitted span are never re-scanned
 * (a second pass would highlight the literal word `class` and shred the tag).
 */
const STRING_AND_KEYWORD_RE = new RegExp(
  `('[^']*'|"[^"]*"|\`[^\`]*\`)|\\b(${KEYWORDS})\\b`,
  "g",
);

/** Prose formats: quoted words are not string literals, `if`/`for`/… are not keywords. */
function isProseLanguage(language: string): boolean {
  return language === "markdown" || language === "plaintext";
}

export function highlightCode(source: string, language: string): string {
  const prose = isProseLanguage(language);
  const lines = source.split("\n");
  return lines
    .map((line) => {
      if (/^\s*#/.test(line) || /^\s*\/\//.test(line)) {
        return `<span class="text-canvas-syntaxComment">${escapeHtml(line)}</span>`;
      }
      const escaped = escapeHtml(line);
      if (prose) {
        // Only inline-code spans get colour; prose words stay plain.
        return escaped.replace(
          /(`[^`]*`)/g,
          '<span class="text-canvas-syntaxString">$1</span>',
        );
      }
      return escaped.replace(
        STRING_AND_KEYWORD_RE,
        (_match, str?: string, keyword?: string) =>
          str
            ? `<span class="text-canvas-syntaxString">${str}</span>`
            : `<span class="text-canvas-syntaxKeyword font-medium">${keyword}</span>`,
      );
    })
    .join("\n");
}

export function languageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    html: "html",
    htm: "html",
    css: "css",
    json: "json",
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
  };
  return map[ext] ?? "plaintext";
}
