/**
 * Rich text helpers — emoji flags, symbols, and mixed scripts across artifacts.
 */

/** Append to any font stack so emoji / flags render on custom body fonts. */
export const EMOJI_FONT_FAMILY =
  '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", emoji';

export const RICH_TEXT_CLASS = "rich-text";

export function withEmojiFontFamily(family: string): string {
  const trimmed = family.trim();
  if (!trimmed) return EMOJI_FONT_FAMILY;
  if (trimmed.includes("Apple Color Emoji")) return trimmed;
  return `${trimmed}, ${EMOJI_FONT_FAMILY}`;
}

/** ISO 3166-1 alpha-2 → regional-indicator flag emoji (e.g. US → 🇺🇸). */
export function countryCodeToFlagEmoji(code: string): string | null {
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return [...upper]
    .map((ch) => String.fromCodePoint(0x1f1e6 - 65 + ch.charCodeAt(0)))
    .join("");
}

const FLAG_SHORTCODE_RE = /:flag[-_]([a-z]{2}):/gi;
const COUNTRY_SHORTCODE_RE = /:([a-z]{2}):/gi;
const LEADING_COUNTRY_CODE_RE = /^([a-zA-Z]{2})\s+(?=[\p{Lu}])/u;
const INLINE_COUNTRY_CODE_RE = /(?<=^|\s)([a-z]{2})(?=\s+[\p{Lu}])/gu;

const NON_COUNTRY_SHORTCODES = new Set([
  "ok",
  "no",
  "or",
  "if",
  "as",
  "at",
  "by",
  "do",
  "go",
  "he",
  "id",
  "is",
  "it",
  "me",
  "my",
  "of",
  "on",
  "so",
  "to",
  "up",
  "we",
]);

function replaceCountryShortcode(_match: string, code: string): string {
  const lower = code.toLowerCase();
  if (NON_COUNTRY_SHORTCODES.has(lower)) return `:${lower}:`;
  return countryCodeToFlagEmoji(code) ?? `:${lower}:`;
}

/**
 * Normalize model output so flags, emoji, and symbols display as intended.
 * Safe for table cells, tags, todo labels, timeline text, etc.
 */
export function formatRichTextForDisplay(text: string): string {
  if (!text) return text;

  let result = text
    .replace(FLAG_SHORTCODE_RE, (_, code: string) => {
      return countryCodeToFlagEmoji(code) ?? `:${code}:`;
    })
    .replace(COUNTRY_SHORTCODE_RE, replaceCountryShortcode);

  result = result.replace(LEADING_COUNTRY_CODE_RE, (match, code: string) => {
    const flag = countryCodeToFlagEmoji(code);
    return flag ? `${flag} ` : match;
  });

  result = result.replace(INLINE_COUNTRY_CODE_RE, (match, code: string) => {
    const flag = countryCodeToFlagEmoji(code);
    return flag ?? match;
  });

  return result;
}
