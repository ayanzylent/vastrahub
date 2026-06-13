import type { ApiResponse, PaginatedResponse } from "@vastrahub/shared-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: RequestMethod;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
  /** Whether to include guest-id header (for cart requests) */
  withGuestId?: boolean;
}

/**
 * Get guest ID from localStorage (client-side only).
 */
function getGuestIdFromStorage(): string {
  if (typeof window === "undefined") return "";
  const GUEST_ID_KEY = "vastrahub_guest_id";
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = crypto.randomUUID();
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

/**
 * Typed API client with built-in error handling, auth cookie forwarding, and guest ID support.
 */
async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers = {}, token, cache, next, withGuestId } = options;

  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (withGuestId) {
    const guestId = getGuestIdFromStorage();
    if (guestId) {
      requestHeaders["X-Guest-Id"] = guestId;
    }
  }

  const fetchOptions: RequestInit & { next?: NextFetchRequestConfig } = {
    method,
    headers: requestHeaders,
    credentials: "include",
    ...(body ? { body: JSON.stringify(body) } : {}),
    ...(cache ? { cache } : {}),
    ...(next ? { next } : {}),
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));

      return {
        success: false,
        error: errorData.error ?? errorData.message ?? `Request failed with status ${response.status}`,
        data: undefined as unknown as T,
        statusCode: response.status,
      };
    }

    return response.json() as Promise<ApiResponse<T>>;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
      data: undefined as unknown as T,
      statusCode: 0,
    };
  }
}

/**
 * Typed paginated request helper.
 */
async function paginatedRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<PaginatedResponse<T>> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const { method = "GET", headers = {}, token, cache, next, withGuestId } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (token) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (withGuestId) {
    const guestId = getGuestIdFromStorage();
    if (guestId) {
      requestHeaders["X-Guest-Id"] = guestId;
    }
  }

  const fetchOptions: RequestInit & { next?: NextFetchRequestConfig } = {
    method,
    headers: requestHeaders,
    credentials: "include",
    ...(cache ? { cache } : {}),
    ...(next ? { next } : {}),
  };

  try {
    const response = await fetch(url, fetchOptions);
    return response.json() as Promise<PaginatedResponse<T>>;
  } catch {
    return {
      success: false,
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
      statusCode: 0,
    };
  }
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "POST", body }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "PUT", body }),

  patch: <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "PATCH", body }),

  delete: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),

  paginated: <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
    paginatedRequest<T>(endpoint, { ...options, method: "GET" }),
};
