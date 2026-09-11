import {
  NextRequest,
  NextResponse,
} from "next/server";
import { BACKEND_URL as API_URL } from "@/lib/backend";

export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
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

    const { id } = await context.params;
    const body = await request.json();

    const response = await fetch(
      `${API_URL}/interviews/${id}`,
      {
        method: "PUT",
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
        message: "Unable to connect to the backend.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
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

    const { id } = await context.params;

    const response = await fetch(
      `${API_URL}/interviews/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      {
        message: "Unable to connect to the backend.",
      },
      {
        status: 500,
      },
    );
  }
}