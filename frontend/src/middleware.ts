import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("vouch_session");

  // Protected role routes
  const protectedPrefixes = ["/student", "/expert", "/sponsor", "/admin"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected && !session?.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/expert/:path*",
    "/sponsor/:path*",
    "/admin/:path*",
  ],
};
