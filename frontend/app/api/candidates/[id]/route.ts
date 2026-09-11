import {
  NextRequest,
  NextResponse,
} from "next/server";
import { BACKEND_URL as API_URL } from "@/lib/backend";

async function forwardCandidateRequest(
  request: NextRequest,
  method: "GET" | "PUT" | "DELETE",
  context: { params: Promise<{ id: string }> },
) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { message: "Not authenticated." },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };
  const init: RequestInit = { method, headers };

  if (method === "PUT") {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(await request.json());
  }

  try {
    const response = await fetch(`${API_URL}/candidates/${id}`, init);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to connect to the backend." },
      { status: 500 },
    );
  }
}

export function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return forwardCandidateRequest(request, "GET", context);
}

export function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  return forwardCandidateRequest(request, "PUT", context);
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
      `${API_URL}/candidates/${id}`,
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
        message:
          "Unable to connect to the backend.",
      },
      {
        status: 500,
      },
    );
  }
}