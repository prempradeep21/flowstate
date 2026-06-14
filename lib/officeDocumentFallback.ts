import mammoth from "mammoth";

function extensionForName(name: string): string {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

export async function loadWordDocumentHtml(
  url: string,
  fileName: string,
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load document (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  const ext = extensionForName(fileName);

  if (ext === "docx") {
    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
    if (result.value.trim()) {
      return wrapFallbackHtml(result.value, fileName);
    }
    throw new Error("Document has no readable content");
  }

  if (ext === "rtf") {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
    return wrapFallbackHtml(
      `<pre>${escapeHtml(stripRtf(text))}</pre>`,
      fileName,
    );
  }

  throw new Error(`Client-side preview is not supported for .${ext} files`);
}

export async function loadPresentationOutline(
  url: string,
  fileName: string,
): Promise<string> {
  const ext = extensionForName(fileName);
  if (ext !== "pptx") {
    throw new Error(`Client-side preview is not supported for .${ext} files`);
  }

  const JSZip = (await import("jszip")).default;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load presentation (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => {
      const num = (path: string) =>
        Number.parseInt(path.match(/slide(\d+)/)?.[1] ?? "0", 10);
      return num(a) - num(b);
    });

  if (slideFiles.length === 0) {
    throw new Error("Presentation has no slides");
  }

  const slides: string[] = [];
  for (const [index, path] of slideFiles.entries()) {
    const xml = await zip.file(path)!.async("text");
    const texts = extractXmlTexts(xml);
    slides.push(
      `<section><h3>Slide ${index + 1}</h3><ul>${texts
        .map((text) => `<li>${escapeHtml(text)}</li>`)
        .join("")}</ul></section>`,
    );
  }

  return wrapFallbackHtml(slides.join(""), fileName);
}

function extractXmlTexts(xml: string): string[] {
  const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g) ?? [];
  return matches
    .map((match) => match.replace(/<\/?a:t[^>]*>/g, "").trim())
    .filter(Boolean);
}

function stripRtf(source: string): string {
  return source
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\'[0-9a-f]{2}/gi, " ")
    .replace(/\\[a-z]+\d*(?: |)/gi, "")
    .replace(/[{}]/g, "")
    .replace(/\s+\n/g, "\n")
    .trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wrapFallbackHtml(body: string, title: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
    body { font-family: Georgia, "Times New Roman", serif; margin: 16px; color: #111; line-height: 1.5; }
    h3 { font-size: 14px; margin: 16px 0 8px; }
    ul { margin: 0 0 12px 18px; padding: 0; }
    li { margin-bottom: 4px; }
    pre { white-space: pre-wrap; font-family: ui-monospace, monospace; font-size: 12px; }
  </style></head><body>${body}</body></html>`;
}
