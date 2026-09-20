import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const loginUrl = new URL("/login", request.url);

  if (!code || !state) {
    loginUrl.searchParams.set("error", "Google login was cancelled.");
    return NextResponse.redirect(loginUrl);
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/auth/google/callback?${new URLSearchParams({
        code,
        state,
      })}`,
      { cache: "no-store" },
    );
    const data = await response.json();

    if (!response.ok) {
      loginUrl.searchParams.set(
        "error",
        Array.isArray(data?.message)
          ? data.message.join(", ")
          : data?.message || "Google login failed.",
      );
      return NextResponse.redirect(loginUrl);
    }

    const nextResponse = NextResponse.redirect(
      new URL("/dashboard", request.url),
    );
    nextResponse.cookies.set("refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return nextResponse;
  } catch {
    loginUrl.searchParams.set("error", "Unable to connect to the backend.");
    return NextResponse.redirect(loginUrl);
  }
}