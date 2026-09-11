import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/backend";

async function forward(request: NextRequest, method: "GET" | "POST") {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/users`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      ...(method === "POST" ? { body: JSON.stringify(await request.json()) } : {}),
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

export function GET(request: NextRequest) {
  return forward(request, "GET");
}

export function POST(request: NextRequest) {
  return forward(request, "POST");
}