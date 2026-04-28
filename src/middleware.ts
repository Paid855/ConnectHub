import { NextRequest, NextResponse } from "next/server";

const ADMIN_SLUG = process.env.ADMIN_SLUG || "";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const path = req.nextUrl.pathname;
  const isAdminSubdomain = host.startsWith("admin.");

  // On admin subdomain: only serve /<slug>* and /api/admin/*
  if (isAdminSubdomain) {
    if (path === "/" || path === "") {
      return NextResponse.rewrite(new URL("/404", req.url));
    }
    if (path.startsWith("/api/admin")) return NextResponse.next();
    if (ADMIN_SLUG && path.startsWith("/" + ADMIN_SLUG)) {
      // Rewrite /<slug>/anything -> /admin-page/c-panel-control/anything internally
      const internal = path.replace("/" + ADMIN_SLUG, "/admin-page/c-panel-control");
      return NextResponse.rewrite(new URL(internal, req.url));
    }
    // Anything else on admin subdomain = 404
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  // On main domain: block direct access to admin paths AND admin APIs
  if (path.startsWith("/admin-page") || path.startsWith("/api/admin")) {
    return NextResponse.rewrite(new URL("/404", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|robots.txt|sitemap.xml).*)",
  ],
};
