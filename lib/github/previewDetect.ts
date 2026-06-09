import type { PreviewData, PreviewType } from "@/lib/github/types";

const PROVIDER_PATTERNS: { pattern: RegExp; provider: string; type: PreviewType; confidence: number }[] = [
  { pattern: /\.github\.io/i, provider: "GitHub Pages", type: "github-pages", confidence: 0.85 },
  { pattern: /vercel\.app/i, provider: "Vercel", type: "hosted-application", confidence: 0.9 },
  { pattern: /netlify\.app/i, provider: "Netlify", type: "hosted-application", confidence: 0.9 },
  { pattern: /pages\.dev/i, provider: "Cloudflare Pages", type: "hosted-application", confidence: 0.85 },
  { pattern: /onrender\.com/i, provider: "Render", type: "hosted-application", confidence: 0.85 },
  { pattern: /railway\.app/i, provider: "Railway", type: "hosted-application", confidence: 0.85 },
  { pattern: /firebaseapp\.com/i, provider: "Firebase", type: "hosted-application", confidence: 0.8 },
  { pattern: /storybook/i, provider: "Storybook", type: "storybook", confidence: 0.75 },
];

const URL_IN_TEXT =
  /https?:\/\/[^\s)\]"'<>]+/gi;

function classifyUrl(url: string): Pick<PreviewData, "previewType" | "deploymentProvider" | "confidence"> {
  for (const { pattern, provider, type, confidence } of PROVIDER_PATTERNS) {
    if (pattern.test(url)) {
      return { previewType: type, deploymentProvider: provider, confidence };
    }
  }
  return { previewType: "static-website", deploymentProvider: undefined, confidence: 0.6 };
}

function cleanUrl(raw: string): string {
  return raw.replace(/[),.\]}>]+$/, "");
}

export function detectPreviewUrl(
  homepage: string | null | undefined,
  readme: string,
  hasGithubPages: boolean,
): PreviewData {
  type Candidate = PreviewData & { url: string };
  const candidates: Candidate[] = [];

  if (homepage?.startsWith("http")) {
    const c = classifyUrl(homepage);
    candidates.push({ url: homepage, previewAvailable: true, ...c });
  }

  if (hasGithubPages) {
    candidates.push({
      url: "",
      previewAvailable: false,
      previewType: "github-pages",
      deploymentProvider: "GitHub Pages",
      confidence: 0.5,
    });
  }

  const urls = readme.match(URL_IN_TEXT) ?? [];
  for (const raw of urls) {
    const url = cleanUrl(raw);
    if (/github\.com|raw\.githubusercontent|localhost|127\.0\.0\.1/i.test(url)) continue;
    const c = classifyUrl(url);
    candidates.push({ url, previewAvailable: c.confidence >= 0.55, ...c });
  }

  candidates.sort((a, b) => b.confidence - a.confidence);
  const best = candidates.find((c) => c.url) ?? candidates[0];

  if (!best?.url) {
    return {
      previewAvailable: false,
      previewType: "no-preview",
      confidence: 0,
    };
  }

  return {
    previewAvailable: best.confidence >= 0.55,
    previewUrl: best.url,
    previewType: best.previewType ?? "static-website",
    deploymentProvider: best.deploymentProvider,
    confidence: best.confidence,
  };
}
