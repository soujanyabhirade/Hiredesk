export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
  });

  if (
    response.status !== 401 ||
    input.toString() === "/api/auth/refresh"
  ) {
    return response;
  }

  const refreshResponse = await fetch(
    "/api/auth/refresh",
    {
      method: "POST",
      credentials: "include",
    },
  );

  if (!refreshResponse.ok) {
    window.location.replace("/login");
    return response;
  }

  return fetch(input, {
    ...init,
    credentials: "include",
  });
}
