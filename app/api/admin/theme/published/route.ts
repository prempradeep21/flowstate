import { NextResponse } from "next/server";
import { readPublishedTheme } from "@/lib/design/theme/publishedTheme.server";

/**
 * Read-only, unauthenticated — the published theme is non-sensitive and is
 * needed both by the design panel (to list custom themes) and by every
 * client's theme store on hydrate (to match what the server already
 * rendered in app/layout.tsx).
 */
export async function GET() {
  const published = readPublishedTheme();
  return NextResponse.json(published);
}
