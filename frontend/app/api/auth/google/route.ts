import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

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
