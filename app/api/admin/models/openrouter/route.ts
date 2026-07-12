import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/adminAccess.server";

export interface OpenRouterCatalogModel {
  id: string;
  name: string;
  contextLength: number | null;
  supportsTools: boolean;
  supportsImages: boolean;
  promptPrice: string | null;
  completionPrice: string | null;
}

interface RawOpenRouterModel {
  id?: unknown;
  name?: unknown;
  context_length?: unknown;
  architecture?: { input_modalities?: unknown } | null;
  pricing?: { prompt?: unknown; completion?: unknown } | null;
  supported_parameters?: unknown;
}

function normalize(raw: RawOpenRouterModel): OpenRouterCatalogModel | null {
  if (typeof raw.id !== "string" || !raw.id) return null;
  const modalities = Array.isArray(raw.architecture?.input_modalities)
    ? (raw.architecture!.input_modalities as unknown[])
    : [];
  const params = Array.isArray(raw.supported_parameters)
    ? (raw.supported_parameters as unknown[])
    : [];
  return {
    id: raw.id,
    name: typeof raw.name === "string" && raw.name ? raw.name : raw.id,
    contextLength:
      typeof raw.context_length === "number" ? raw.context_length : null,
    supportsTools: params.includes("tools"),
    supportsImages: modalities.includes("image"),
    promptPrice:
      typeof raw.pricing?.prompt === "string" ? raw.pricing!.prompt : null,
    completionPrice:
      typeof raw.pricing?.completion === "string"
        ? raw.pricing!.completion
        : null,
  };
}

/**
 * Admin-only proxy for OpenRouter's public model catalog. Fetched live because
 * OpenRouter adds models continuously; the admin console filters + selects from
 * this list. The API key is optional for /models but sent when available.
 */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      // Catalog changes slowly; let Next cache it briefly to avoid hammering.
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenRouter returned ${res.status}` },
        { status: 502 },
      );
    }
    const body = (await res.json()) as { data?: RawOpenRouterModel[] };
    const models = (body.data ?? [])
      .map(normalize)
      .filter((m): m is OpenRouterCatalogModel => m !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json({ models });
  } catch {
    return NextResponse.json(
      { error: "Could not reach OpenRouter." },
      { status: 502 },
    );
  }
}
