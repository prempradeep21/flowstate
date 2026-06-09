export type EmbedProviderId = "reddit" | "twitter" | "instagram" | "facebook";

export interface EmbedResolveResult {
  provider: EmbedProviderId;
  url: string;
  title: string;
  embedWidth: number;
  embedHeight: number;
  iframeSrc?: string;
  embedHtml?: string;
  status: "ready" | "failed";
  fallback?: {
    domainLabel: string;
    faviconUrl?: string;
    previewImageUrl?: string;
  };
}

export interface EmbedProvider {
  id: EmbedProviderId;
  match: (url: URL) => boolean;
  resolve: (url: URL) => Promise<OembedProviderResult>;
}

export interface OembedProviderResult {
  title: string;
  embedWidth: number;
  embedHeight: number;
  iframeSrc?: string;
  embedHtml?: string;
}
