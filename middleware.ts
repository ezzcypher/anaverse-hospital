import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware — two jobs only:
 *
 *  1. Keep /admin and /api out of caches and search indexes.
 *  2. Bounce obviously-unauthenticated visitors away from /admin pages before
 *     they render. This is a fast presence check on the session cookie; the
 *     real cryptographic + database verification happens in app/admin/layout
 *     and in requireAdmin() for the API. Middleware runs on the Edge runtime
 *     and cannot reach Prisma or Node crypto, so it deliberately does less.
 */

const COOKIE_NAME = "__Host-av_admin";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLogin = pathname === "/admin/login";

  if (isAdminPage && !isLogin) {
    const cookie = req.cookies.get(COOKIE_NAME)?.value;
    const looksValid = !!cookie && cookie.includes(".") && cookie.length > 40;
    if (!looksValid) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return withHardening(NextResponse.redirect(url));
    }
  }

  return withHardening(NextResponse.next());
}

function withHardening(res: NextResponse): NextResponse {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
