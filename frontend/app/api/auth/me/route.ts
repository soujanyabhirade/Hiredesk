import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the backend." },
      { status: 500 },
    );
  }
}