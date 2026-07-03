import { marked } from "marked";
import { readLegalDocument } from "@/lib/legal/readLegalDocument";

marked.setOptions({ gfm: true, breaks: false });

function wrapTables(html: string): string {
  return html
    .replace(/<table>/g, '<div class="legal-table-wrap"><table>')
    .replace(/<\/table>/g, "</table></div>");
}

export function renderLegalDocumentHtml(filename: string): string {
  const markdown = readLegalDocument(filename);
  const html = marked.parse(markdown) as string;
  return wrapTables(html);
}
