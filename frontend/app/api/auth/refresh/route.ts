import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL as API_URL } from "@/lib/backend";

export async function POST(request: NextRequest) {
  try {
    const refreshToken =
      request.cookies.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          message: "No refresh token found.",
        },
        {
          status: 401,
        },
      );
    }

    const response = await fetch(
      `${API_URL}/auth/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      const nextResponse =
        NextResponse.json(
          {
            message:
              data?.message ||
              "Refresh token is invalid or expired.",
          },
          {
            status: response.status,
          },
        );

      nextResponse.cookies.delete("refresh_token");

      return nextResponse;
    }

    const nextResponse =
      NextResponse.json({
        access_token: data.access_token,
        message: "Token refreshed successfully.",
      });

    nextResponse.cookies.set(
      "refresh_token",
      data.refresh_token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      },
    );

    return nextResponse;
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