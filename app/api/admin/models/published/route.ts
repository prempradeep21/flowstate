import { NextResponse } from "next/server";
import { readPublishedModels } from "@/lib/modelConfig/publishedModels.server";

/**
 * Read-only, unauthenticated — the published model list is non-sensitive and is
 * needed by every client's composer to render the model dropdown.
 */
export async function GET() {
  return NextResponse.json(readPublishedModels());
}
