import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** Anonymous visitor id. Same cookie /api/track has always used. */
const VISITOR_COOKIE = "fs_vid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months

/**
 * Guarantees every request carries an fs_vid, which the guest credit wall
 * needs as its identity. /api/track set this cookie, but only on the routes it
 * ran on — a visitor landing straight on /api/chat had none, so their usage
 * could not be attributed or limited at all.
 *
 * Sets it on BOTH the request (so handlers in this same request can read it)
 * and the response (so the browser keeps it).
 */
function ensureVisitorCookie(request: NextRequest, response: NextResponse) {
  if (request.cookies.get(VISITOR_COOKIE)?.value) return;
  // Web Crypto, not node:crypto — middleware runs on the Edge runtime,
  // where node: scheme imports are not resolvable.
  const visitorId = crypto.randomUUID();
  request.cookies.set(VISITOR_COOKIE, visitorId);
  response.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });
}

export async function middleware(request: NextRequest) {
  if (
    process.env.NEXT_DIST_DIR === ".next-artifact-catalog" &&
    request.nextUrl.pathname === "/"
  ) {
    return NextResponse.redirect(new URL("/dev/artifact-catalog", request.url));
  }

  if (
    process.env.NEXT_DIST_DIR === ".next-design-system" &&
    request.nextUrl.pathname === "/"
  ) {
    return NextResponse.redirect(new URL("/dev/design-system", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname === "/") {
    const callbackUrl = request.nextUrl.clone();
    callbackUrl.pathname = "/auth/callback";
    return NextResponse.redirect(callbackUrl);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    const bare = NextResponse.next({ request });
    ensureVisitorCookie(request, bare);
    return bare;
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  // After getUser() on purpose: setAll() above REPLACES supabaseResponse, so a
  // cookie set before the refresh would be thrown away with the old response.
  ensureVisitorCookie(request, supabaseResponse);

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|landing(?:/|$)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
