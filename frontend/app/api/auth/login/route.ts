import { NextResponse } from "next/server";

const API_URL = process.env.BACKEND_URL ?? "http://localhost:3001";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(
      `${API_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: body.email,
          password: body.password,
        }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message:
            data?.message ||
            "Login failed.",
        },
        {
          status: response.status,
        },
      );
    }

    const nextResponse =
      NextResponse.json({
        access_token: data.access_token,
        message: "Login successful.",
      });

    nextResponse.cookies.set(
      "refresh_token",
      data.refresh_token,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      },
    );

    return nextResponse;
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