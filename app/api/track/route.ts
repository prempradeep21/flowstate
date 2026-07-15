import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import {
  deriveSource,
  referrerHost,
  worldRegionForCountry,
} from "@/lib/analytics/visitorSource";
import {
  createServiceRoleClient,
  isServiceRoleConfigured,
} from "@/lib/supabase/serviceRole";

// Node runtime so the Supabase service-role client works; Vercel still injects
// the x-vercel-ip-* geo headers here.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VISITOR_COOKIE = "fs_vid";
// ~13 months — long enough to approximate "unique visitor" across return trips.
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 400;

/** Anonymous page-view beacon. Never throws to the client — analytics must not
 *  break navigation. Always 204 so `sendBeacon` / `fetch` stay cheap. */
export async function POST(request: NextRequest) {
  const res = new NextResponse(null, { status: 204 });

  try {
    let visitorId = request.cookies.get(VISITOR_COOKIE)?.value ?? null;
    if (!visitorId) {
      visitorId = randomUUID();
      res.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: VISITOR_COOKIE_MAX_AGE,
      });
    }

    if (!isServiceRoleConfigured()) return res;

    const body = (await request.json().catch(() => ({}))) as {
      path?: unknown;
      referrer?: unknown;
    };
    const path = typeof body.path === "string" ? body.path.slice(0, 512) : null;

    // Skip internal/admin/dev noise — we care about public entry traffic.
    if (path && /^\/(admin|dev|api|auth)(\/|$)/.test(path)) return res;

    const refHost = referrerHost(
      typeof body.referrer === "string" ? body.referrer : null,
    );

    const url = request.nextUrl;
    const utmSource = url.searchParams.get("utm_source");
    const utmMedium = url.searchParams.get("utm_medium");
    const utmCampaign = url.searchParams.get("utm_campaign");

    const selfHost = request.headers.get("host")?.split(":")[0] ?? null;
    const source = deriveSource({
      referrerHost: refHost,
      utmSource,
      selfHost,
    });

    const country = request.headers.get("x-vercel-ip-country") ?? null;
    const region = request.headers.get("x-vercel-ip-country-region") ?? null;
    const cityRaw = request.headers.get("x-vercel-ip-city") ?? null;
    const city = cityRaw ? safeDecode(cityRaw) : null;

    // Supabase SSR stores the session in a non-httpOnly `sb-<ref>-auth-token`
    // cookie; its presence is a good-enough logged-in signal for bucketing.
    const isAuthenticated = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));

    const supabase = createServiceRoleClient();
    await supabase.from("visitor_events").insert({
      visitor_id: visitorId,
      path,
      is_authenticated: isAuthenticated,
      referrer_host: refHost,
      source,
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      country,
      region,
      city,
      world_region: worldRegionForCountry(country),
    });
  } catch {
    // Swallow — a failed beacon should never surface to the visitor.
  }

  return res;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
