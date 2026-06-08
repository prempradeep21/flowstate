import { validateLinkPreviewUrl } from "@/lib/linkPreview";

const SCREENSHOT_TIMEOUT_MS = 15000;

interface MicrolinkScreenshot {
  url?: string;
}

interface MicrolinkImage {
  url?: string;
}

interface MicrolinkResponse {
  status?: string;
  data?: {
    screenshot?: MicrolinkScreenshot;
    image?: MicrolinkImage;
  };
}

/**
 * Fetch a rendered page screenshot via Microlink when og:image is unavailable.
 * Optional MICROLINK_API_KEY raises rate limits.
 */
export async function fetchPageScreenshot(url: string): Promise<string | null> {
  const parsed = validateLinkPreviewUrl(url);
  if (!parsed) return null;

  const apiKey = process.env.MICROLINK_API_KEY?.trim();
  const params = new URLSearchParams({
    url: parsed.toString(),
    screenshot: "true",
    meta: "false",
  });

  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (apiKey) {
    headers["x-api-key"] = apiKey;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SCREENSHOT_TIMEOUT_MS);

  try {
    const res = await fetch(
      `https://api.microlink.io/?${params.toString()}`,
      { signal: controller.signal, headers },
    );
    if (!res.ok) return null;

    const body = (await res.json()) as MicrolinkResponse;
    if (body.status && body.status !== "success") return null;

    const screenshotUrl = body.data?.screenshot?.url?.trim();
    if (screenshotUrl) return screenshotUrl;

    const imageUrl = body.data?.image?.url?.trim();
    return imageUrl || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
