import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const accessToken =
    request.cookies.get("refresh_token")?.value;

  const isProtectedRoute =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname.startsWith(
      "/candidates",
    ) ||
    request.nextUrl.pathname.startsWith("/jobs") ||
    request.nextUrl.pathname.startsWith(
      "/interviews",
    ) ||
    request.nextUrl.pathname.startsWith(
      "/feedback",
    ) ||
    request.nextUrl.pathname.startsWith(
      "/dashboard",
    );

  const isUsersRoute = request.nextUrl.pathname.startsWith("/users");

  if ((isProtectedRoute || isUsersRoute) && !accessToken) {
    return NextResponse.redirect(
      new URL("/login", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/candidates/:path*",
    "/jobs/:path*",
    "/interviews/:path*",
    "/feedback/:path*",
    "/dashboard/:path*",
    "/users/:path*",
  ],
};