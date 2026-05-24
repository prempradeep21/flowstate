/** Lightweight syntax highlighting for code artifacts (no extra deps). */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const KEYWORD_RE =
  /\b(def|class|if|elif|else|return|import|from|const|let|var|function|async|await|export|default|interface|type|enum|struct|public|private|void|int|float|bool|string|new|try|catch|finally|for|while|switch|case|break|continue|extends|implements|package|using|namespace|template|typename)\b/g;

export function highlightCode(source: string, _language: string): string {
  const lines = source.split("\n");
  return lines
    .map((line) => {
      if (/^\s*#/.test(line) || /^\s*\/\//.test(line)) {
        return `<span class="text-[#116329]">${escapeHtml(line)}</span>`;
      }
      let html = escapeHtml(line);
      html = html.replace(
        /('[^']*'|"[^"]*"|`[^`]*`)/g,
        '<span class="text-[#953800]">$1</span>',
      );
      html = html.replace(
        KEYWORD_RE,
        '<span class="text-[#0550AE] font-medium">$1</span>',
      );
      return html;
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
