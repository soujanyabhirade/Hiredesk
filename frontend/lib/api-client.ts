import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

type ApiFetchInit = RequestInit & {
  /** Use for login, activation, logout, and refresh requests. */
  skipAuthRefresh?: boolean;
};

export type ApiResponse = {
  ok: boolean;
  status: number;
  json: <T = unknown>() => Promise<T>;
};

/**
 * The single browser API client. Requests stay same-origin so the Next BFF
 * routes can continue to protect the HTTP-only access and refresh cookies.
 */
export const api = axios.create({
  baseURL: "/",
  withCredentials: true,
  validateStatus: () => true,
});

let refreshPromise: Promise<AxiosResponse> | null = null;

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api.post("/api/auth/refresh", undefined, {
      skipAuthRefresh: true,
    } as AxiosRequestConfig);

    void refreshPromise.then(
      () => {
        refreshPromise = null;
      },
      () => {
        refreshPromise = null;
      },
    );
  }

  return refreshPromise;
}

function expireSession() {
  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
}

api.interceptors.response.use(async (response) => {
  const config = response.config as RetryableConfig;
  const isRefreshRequest = config.url === "/api/auth/refresh";

  if (
    response.status !== 401 ||
    config.skipAuthRefresh ||
    config._retry ||
    isRefreshRequest
  ) {
    return response;
  }

  config._retry = true;
  let refreshResponse: AxiosResponse;

  try {
    refreshResponse = await refreshSession();
  } catch {
    expireSession();
    return response;
  }

  if (refreshResponse.status < 200 || refreshResponse.status >= 300) {
    expireSession();
    return response;
  }

  return api.request(config);
});

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

/**
 * Compatibility wrapper for the existing pages while all network traffic is
 * performed by the Axios instance above.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: ApiFetchInit,
): Promise<ApiResponse> {
  const response = await api.request({
    url: requestUrl(input),
    method: init?.method,
    headers: init?.headers,
    data: init?.body,
    skipAuthRefresh: init?.skipAuthRefresh,
  } as AxiosRequestConfig);

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    json: async <T>() => response.data as T,
  };
}
