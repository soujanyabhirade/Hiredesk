import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

type RetryableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

type ApiFetchInit = RequestInit & {
  skipAuthRefresh?: boolean;
};

export type ApiResponse = {
  ok: boolean;
  status: number;
  json: <T = unknown>() => Promise<T>;
};

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001";

let memoryAccessToken: string | null = null;
let refreshPromise: Promise<void> | null = null;
let initPromise: Promise<void> | null = null;

export const api = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
  validateStatus: () => true,
});

export const authApi = axios.create({
  baseURL: "/",
  withCredentials: true,
  validateStatus: () => true,
});

function setMemoryToken(token: string | null) {
  memoryAccessToken = token;
}

function getMemoryToken(): string | null {
  return memoryAccessToken;
}

async function initializeAuth(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const resp = await authApi.post("/api/auth/refresh", undefined, {
          skipAuthRefresh: true,
        } as AxiosRequestConfig);
        if (resp.status === 200 && resp.data?.access_token) {
          memoryAccessToken = resp.data.access_token;
        }
      } catch {
        memoryAccessToken = null;
      }
    })();
  }
  return initPromise;
}

async function refreshAccessToken(): Promise<void> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const resp = await authApi.post("/api/auth/refresh", undefined, {
        skipAuthRefresh: true,
      } as AxiosRequestConfig);
      if (resp.status === 200 && resp.data?.access_token) {
        memoryAccessToken = resp.data.access_token;
      } else {
        memoryAccessToken = null;
        throw new Error("Refresh failed");
      }
    })();
  }
  return refreshPromise;
}

function expireSession() {
  memoryAccessToken = null;
  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
}

api.interceptors.request.use(async (config) => {
  await initPromise;
  if (memoryAccessToken) {
    config.headers.Authorization = `Bearer ${memoryAccessToken}`;
  }
  return config;
});

api.interceptors.response.use(async (response) => {
  const config = response.config as RetryableConfig;
  const isRefreshRequest = config.url?.includes("/auth/refresh");

  if (
    response.status !== 401 ||
    config.skipAuthRefresh ||
    config._retry ||
    isRefreshRequest
  ) {
    return response;
  }

  config._retry = true;

  try {
    await refreshAccessToken();
    return api.request(config);
  } catch {
    expireSession();
    return response;
  }
});

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init?: ApiFetchInit,
): Promise<ApiResponse> {
  await initPromise;
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

export async function authFetch(
  input: RequestInfo | URL,
  init?: ApiFetchInit,
): Promise<ApiResponse> {
  const response = await authApi.request({
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

export { setMemoryToken, getMemoryToken, initializeAuth, refreshAccessToken };