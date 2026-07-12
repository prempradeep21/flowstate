import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/adminAccess.server";
import { updatePublishedModels } from "@/lib/modelConfig/publishedModels.server";
import {
  MAX_OPENROUTER_MODELS,
  normalizePublishedModels,
} from "@/lib/modelConfig/publishedModelsTypes";

interface PublishBody {
  openrouterModels?: unknown;
}

/**
 * Saves the admin's curated + prioritised OpenRouter model list (max 10) as the
 * set exposed to users in the composer dropdown. Native Claude models are always
 * available and are not stored here. Writes lib/modelConfig/publishedModels.json.
 */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: PublishBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.openrouterModels)) {
    return NextResponse.json(
      { error: "openrouterModels must be an array" },
      { status: 400 },
    );
  }
  if (body.openrouterModels.length > MAX_OPENROUTER_MODELS) {
    return NextResponse.json(
      { error: `At most ${MAX_OPENROUTER_MODELS} models may be selected.` },
      { status: 400 },
    );
  }

  // normalizePublishedModels dedupes, validates, and hard-caps at the max.
  const next = normalizePublishedModels({
    v: 1,
    openrouterModels: body.openrouterModels,
  });

  const result = updatePublishedModels(() => next);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 501 });
  }

  return NextResponse.json(result.data);
}
