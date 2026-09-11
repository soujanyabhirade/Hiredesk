import { NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend";

export async function GET() {
  const response = await fetch(`${BACKEND_URL}/auth/google`, {
    cache: "no-store",
  });
  const data = await response.json();

  if (!response.ok || !data.authorization_url) {
    return NextResponse.json(
      { message: data?.message || "Google login is unavailable." },
      { status: response.status || 503 },
    );
  }

  return NextResponse.redirect(data.authorization_url);
}
