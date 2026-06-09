import { facebookProvider } from "@/lib/embed/providers/facebook";
import { instagramProvider } from "@/lib/embed/providers/instagram";
import { redditProvider } from "@/lib/embed/providers/reddit";
import { twitterProvider } from "@/lib/embed/providers/twitter";
import type { EmbedProvider, EmbedProviderId } from "@/lib/embed/types";
import { normalizeHttpUrl } from "@/lib/urlDetection";

const PROVIDERS: EmbedProvider[] = [
  redditProvider,
  twitterProvider,
  instagramProvider,
  facebookProvider,
];

export function getEmbedProviders(): readonly EmbedProvider[] {
  return PROVIDERS;
}

export function matchEmbedProvider(rawUrl: string): EmbedProvider | null {
  const normalized = normalizeHttpUrl(rawUrl);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    for (const provider of PROVIDERS) {
      if (provider.match(url)) return provider;
    }
  } catch {
    return null;
  }
  return null;
}

export function matchEmbedProviderId(rawUrl: string): EmbedProviderId | null {
  return matchEmbedProvider(rawUrl)?.id ?? null;
}
