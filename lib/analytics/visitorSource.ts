// Pure helpers for classifying anonymous visitor traffic: turning a referrer
// host / UTM tag into a friendly source label, and an ISO country code into a
// world-region ("area of the world") bucket. Kept dependency-free so it runs in
// the edge-adjacent track route and is unit-testable.

/** Known referrer hosts → friendly source label. Checked as suffix matches. */
const HOST_SOURCE_MAP: Array<[test: string, label: string]> = [
  ["reddit.com", "Reddit"],
  ["redd.it", "Reddit"],
  ["news.ycombinator.com", "Hacker News"],
  ["ycombinator.com", "Hacker News"],
  ["producthunt.com", "Product Hunt"],
  ["twitter.com", "X / Twitter"],
  ["x.com", "X / Twitter"],
  ["t.co", "X / Twitter"],
  ["youtube.com", "YouTube"],
  ["youtu.be", "YouTube"],
  ["linkedin.com", "LinkedIn"],
  ["lnkd.in", "LinkedIn"],
  ["facebook.com", "Facebook"],
  ["instagram.com", "Instagram"],
  ["t.me", "Telegram"],
  ["discord.com", "Discord"],
  ["discord.gg", "Discord"],
  ["github.com", "GitHub"],
  ["medium.com", "Medium"],
  ["substack.com", "Substack"],
  ["bing.com", "Bing"],
  ["duckduckgo.com", "DuckDuckGo"],
  ["google.", "Google"], // google.com, google.co.in, etc.
];

/** UTM source values → friendly label (normalised lowercase). */
const UTM_SOURCE_MAP: Record<string, string> = {
  reddit: "Reddit",
  hn: "Hacker News",
  hackernews: "Hacker News",
  producthunt: "Product Hunt",
  ph: "Product Hunt",
  twitter: "X / Twitter",
  x: "X / Twitter",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  instagram: "Instagram",
  ig: "Instagram",
  telegram: "Telegram",
  discord: "Discord",
  github: "GitHub",
  google: "Google",
  newsletter: "Newsletter",
  email: "Email",
};

/** Normalise a referrer URL/string to a bare host (no www, lowercase). */
export function referrerHost(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    return url.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    // Some referrers arrive as a bare host already.
    const cleaned = referrer.trim().replace(/^www\./, "").toLowerCase();
    return cleaned.length > 0 && cleaned.includes(".") ? cleaned : null;
  }
}

/**
 * Derive a friendly source label. UTM source wins (explicit campaign tagging),
 * then referrer host, else "Direct" (typed URL, bookmark, or app that strips
 * the referrer). `selfHost` lets us fold same-origin referrers into "Direct".
 */
export function deriveSource(input: {
  referrerHost?: string | null;
  utmSource?: string | null;
  selfHost?: string | null;
}): string {
  const utm = input.utmSource?.trim().toLowerCase();
  if (utm) {
    return UTM_SOURCE_MAP[utm] ?? titleCase(utm);
  }

  const host = input.referrerHost?.toLowerCase() ?? null;
  if (!host) return "Direct";

  const self = input.selfHost?.replace(/^www\./, "").toLowerCase();
  if (self && (host === self || host.endsWith(`.${self}`))) return "Direct";

  for (const [test, label] of HOST_SOURCE_MAP) {
    if (host === test || host.endsWith(test) || host.includes(test)) {
      return label;
    }
  }

  // Unknown external referrer — surface the bare domain so it is still useful.
  return host;
}

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

// ---------------------------------------------------------------------------
// World-region ("area of the world") bucketing from ISO-3166 alpha-2 codes.
// ---------------------------------------------------------------------------

const CONTINENT_BY_COUNTRY: Record<string, WorldRegion> = {
  // North America
  US: "North America", CA: "North America", MX: "North America",
  GT: "North America", CU: "North America", HT: "North America",
  DO: "North America", HN: "North America", NI: "North America",
  CR: "North America", PA: "North America", JM: "North America",
  TT: "North America", BS: "North America", BZ: "North America",
  SV: "North America", PR: "North America",
  // South America
  BR: "South America", AR: "South America", CO: "South America",
  CL: "South America", PE: "South America", VE: "South America",
  EC: "South America", BO: "South America", PY: "South America",
  UY: "South America", GY: "South America", SR: "South America",
  // Europe
  GB: "Europe", IE: "Europe", FR: "Europe", DE: "Europe", ES: "Europe",
  PT: "Europe", IT: "Europe", NL: "Europe", BE: "Europe", LU: "Europe",
  CH: "Europe", AT: "Europe", SE: "Europe", NO: "Europe", DK: "Europe",
  FI: "Europe", IS: "Europe", PL: "Europe", CZ: "Europe", SK: "Europe",
  HU: "Europe", RO: "Europe", BG: "Europe", GR: "Europe", HR: "Europe",
  SI: "Europe", RS: "Europe", BA: "Europe", MK: "Europe", AL: "Europe",
  ME: "Europe", EE: "Europe", LV: "Europe", LT: "Europe", UA: "Europe",
  BY: "Europe", MD: "Europe", RU: "Europe", MT: "Europe", CY: "Europe",
  // Asia
  IN: "Asia", CN: "Asia", JP: "Asia", KR: "Asia", KP: "Asia",
  ID: "Asia", PK: "Asia", BD: "Asia", LK: "Asia", NP: "Asia",
  BT: "Asia", MM: "Asia", TH: "Asia", VN: "Asia", KH: "Asia",
  LA: "Asia", MY: "Asia", SG: "Asia", PH: "Asia", TW: "Asia",
  HK: "Asia", MO: "Asia", MN: "Asia", KZ: "Asia", UZ: "Asia",
  TM: "Asia", KG: "Asia", TJ: "Asia", AF: "Asia", IR: "Asia",
  IQ: "Asia", SA: "Asia", AE: "Asia", QA: "Asia", KW: "Asia",
  BH: "Asia", OM: "Asia", YE: "Asia", JO: "Asia", LB: "Asia",
  SY: "Asia", IL: "Asia", PS: "Asia", TR: "Asia", GE: "Asia",
  AM: "Asia", AZ: "Asia",
  // Africa
  ZA: "Africa", NG: "Africa", EG: "Africa", KE: "Africa", GH: "Africa",
  MA: "Africa", DZ: "Africa", TN: "Africa", LY: "Africa", ET: "Africa",
  TZ: "Africa", UG: "Africa", RW: "Africa", SN: "Africa", CI: "Africa",
  CM: "Africa", AO: "Africa", MZ: "Africa", ZW: "Africa", ZM: "Africa",
  BW: "Africa", NA: "Africa", MU: "Africa", MG: "Africa", SD: "Africa",
  SO: "Africa", ML: "Africa",
  // Oceania
  AU: "Oceania", NZ: "Oceania", FJ: "Oceania", PG: "Oceania",
  NC: "Oceania", GU: "Oceania",
};

export type WorldRegion =
  | "North America"
  | "South America"
  | "Europe"
  | "Asia"
  | "Africa"
  | "Oceania"
  | "Unknown";

/** Map an ISO alpha-2 country code to a coarse world region. */
export function worldRegionForCountry(
  country: string | null | undefined,
): WorldRegion {
  if (!country) return "Unknown";
  return CONTINENT_BY_COUNTRY[country.trim().toUpperCase()] ?? "Unknown";
}

/** Best-effort human name for common ISO alpha-2 codes; falls back to the code. */
export function countryName(country: string | null | undefined): string {
  if (!country) return "Unknown";
  const code = country.trim().toUpperCase();
  try {
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}
