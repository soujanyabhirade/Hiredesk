import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL as API_URL } from "@/lib/backend";

export async function GET(request: NextRequest) {
  try {
    const accessToken =
      request.cookies.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          message: "Not authenticated.",
        },
        {
          status: 401,
        },
      );
    }

    const response = await fetch(
      `${API_URL}/dashboard`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data?.message ||
            "Failed to load dashboard.",
        },
        {
          status: response.status,
        },
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      {
        message:
          "Unable to connect to the backend.",
      },
      {
        status: 500,
      },
    );
  }
}