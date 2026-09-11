import {
  NextRequest,
  NextResponse,
} from "next/server";
import { BACKEND_URL as API_URL } from "@/lib/backend";

export async function GET(
  request: NextRequest,
) {
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

    const searchParams =
      request.nextUrl.searchParams;

    const response = await fetch(
      `${API_URL}/candidates?${searchParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
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

export async function POST(
  request: NextRequest,
) {
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

    const body = await request.json();

    const response = await fetch(
      `${API_URL}/candidates`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
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