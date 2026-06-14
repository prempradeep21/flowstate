import type { CustomArtifactData } from "@/lib/artifactTypes";
import { customArtifactByteSize, CUSTOM_ARTIFACT_MAX_BYTES } from "@/lib/customArtifact";

export type CustomArtifactPayload = {
  type: "custom";
  title: string;
  description?: string;
  data: CustomArtifactData;
};

/** Pull inline HTML/CSS/JS out of a full HTML document or fragment. */
export function htmlDocumentToCustomData(html: string): CustomArtifactData | null {
  const trimmed = html.trim();
  if (!trimmed) return null;

  const styleBlocks = [
    ...trimmed.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi),
  ].map((m) => m[1].trim());
  const scriptBlocks = [
    ...trimmed.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi),
  ].map((m) => m[1].trim());

  let bodyHtml = trimmed;
  const bodyMatch = trimmed.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    bodyHtml = bodyMatch[1].trim();
  } else if (/^\s*<!DOCTYPE/i.test(trimmed) || /^\s*<html[\s>]/i.test(trimmed)) {
    bodyHtml = trimmed
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<\/?html[^>]*>/gi, "")
      .replace(/<\/?head[^>]*>[\s\S]*?<\/head>/gi, "")
      .replace(/<\/?body[^>]*>/gi, "")
      .trim();
  }

  bodyHtml = bodyHtml
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .trim();

  if (!bodyHtml) return null;

  const css = styleBlocks.filter(Boolean).join("\n\n") || undefined;
  const js = scriptBlocks.filter(Boolean).join("\n\n") || undefined;
  return { html: bodyHtml, css, js };
}

const ATTACHED_HTML_RE =
  /(?:Attached asset context:|Asset:)[^\n]*(?:\(text\/html\)|\.html\)|\(text\/plain\))[^\n]*\n([\s\S]*?)(?:\n\n(?:Attached asset context:|Attached skill context:|$)|$)/i;

const ATTACHED_FILE_HTML_RE =
  /Attached file: [^\n]+\n([\s\S]*?)(?:\n\n|\[File truncated|$)/i;

/** Extract HTML pasted from canvas asset/file attachments in the user question. */
export function extractAttachedHtmlFromQuestion(question: string): string | null {
  const assetMatch = question.match(ATTACHED_HTML_RE);
  if (assetMatch?.[1]?.trim()) {
    const body = assetMatch[1].trim();
    if (/<html[\s>]|<body[\s>]|<div[\s>]|<!doctype/i.test(body)) {
      return body;
    }
  }

  const fileMatch = question.match(ATTACHED_FILE_HTML_RE);
  if (fileMatch?.[1]?.trim() && /<html[\s>]|<body[\s>]|<div[\s>]/i.test(fileMatch[1])) {
    return fileMatch[1].trim();
  }

  return null;
}

export function wantsHtmlAsCustomUi(question: string): boolean {
  const q = question.trim();
  if (!q) return false;
  return (
    /\b(run|show|use|render|display|open)\b.{0,40}\b(html|this code|this file)\b/i.test(q) ||
    /\bcustom\b.{0,24}\b(html|ui)\b/i.test(q) ||
    /\b(html|code)\b.{0,32}\b(custom|ui|component)\b/i.test(q) ||
    /\bwith this code\b/i.test(q)
  );
}

const MONOCHROME_RE =
  /\b(black\s+and\s+white|monochrome|grayscale|greyscale|b&w|black\s*&\s*white)\b/i;
const DARK_THEME_RE = /\b(dark\s+(?:mode|theme)|night\s+mode)\b/i;
const LIGHT_THEME_RE = /\b(light\s+(?:mode|theme))\b/i;

const THEME_CSS: Record<string, string> = {
  monochrome: `
/* Applied theme: monochrome */
html, body { filter: grayscale(1) !important; }
* { --accent: #222 !important; }
`,
  dark: `
/* Applied theme: dark */
:root, body {
  color-scheme: dark;
  background: #0f0f0f !important;
  color: #f0f0f0 !important;
}
button, input, select, textarea { background: #1a1a1a; color: #f0f0f0; border-color: #444; }
`,
  light: `
/* Applied theme: light */
:root, body {
  color-scheme: light;
  background: #fafafa !important;
  color: #111 !important;
}
button, input, select, textarea { background: #fff; color: #111; border-color: #ccc; }
`,
};

function appendThemeCss(
  payload: CustomArtifactPayload,
  themeKey: keyof typeof THEME_CSS,
): CustomArtifactPayload {
  const overlay = THEME_CSS[themeKey];
  const data: CustomArtifactData = {
    ...payload.data,
    css: [payload.data.css?.trim(), overlay.trim()].filter(Boolean).join("\n\n"),
  };
  return { ...payload, data };
}

function fitsCustomLimit(payload: CustomArtifactPayload): boolean {
  return customArtifactByteSize(payload.data) <= CUSTOM_ARTIFACT_MAX_BYTES;
}

/**
 * Deterministic custom UI edits that skip the LLM — theme tweaks, etc.
 * Returns null when the request needs model reasoning.
 */
export function trySimpleCustomEdit(
  payload: CustomArtifactPayload,
  question: string,
): CustomArtifactPayload | null {
  const q = question.trim();
  if (!q || payload.type !== "custom") return null;

  let next: CustomArtifactPayload | null = null;
  if (MONOCHROME_RE.test(q)) next = appendThemeCss(payload, "monochrome");
  else if (DARK_THEME_RE.test(q)) next = appendThemeCss(payload, "dark");
  else if (LIGHT_THEME_RE.test(q)) next = appendThemeCss(payload, "light");

  if (!next || !fitsCustomLimit(next)) return null;
  return next;
}

/** Import attached HTML as a custom artifact without calling the model. */
export function tryImportAttachedHtmlAsCustom(
  question: string,
  fallbackTitle = "Imported UI",
): CustomArtifactPayload | null {
  const raw = extractAttachedHtmlFromQuestion(question);
  if (!raw) return null;

  const data = htmlDocumentToCustomData(raw);
  if (!data) return null;

  const titleMatch = question.match(/Asset: ([^\n(]+)/i);
  const title = titleMatch?.[1]?.trim() || fallbackTitle;

  const payload: CustomArtifactPayload = {
    type: "custom",
    title,
    description: "Imported from attached HTML",
    data,
  };
  if (!fitsCustomLimit(payload)) return null;
  return payload;
}

export function customEditAckText(question: string): string {
  if (MONOCHROME_RE.test(question)) {
    return "Applied a **black & white** theme — colors are now monochrome. The previous version is saved in the artifact history.";
  }
  if (DARK_THEME_RE.test(question)) {
    return "Applied a **dark theme**. The previous version is saved in the artifact history.";
  }
  if (LIGHT_THEME_RE.test(question)) {
    return "Applied a **light theme**. The previous version is saved in the artifact history.";
  }
  return "Updated the custom UI. The previous version is saved in the artifact history.";
}

export function htmlImportAckText(title: string): string {
  return `Imported **${title}** as a custom UI component — no regeneration needed. You can follow up to tweak styles or behavior.`;
}
