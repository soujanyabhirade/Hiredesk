import { NextRequest } from "next/server";

export const BACKEND_URL =
  process.env.BACKEND_URL ?? "http://localhost:3001";

export function backendHeaders(
  request: NextRequest,
  headers?: HeadersInit,
) {
  const result = new Headers(headers);
  const accessToken = request.cookies.get("access_token")?.value;

  if (accessToken) {
    result.set("Authorization", `Bearer ${accessToken}`);
  }

  return result;
}
