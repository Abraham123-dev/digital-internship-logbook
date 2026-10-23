import type { ApiResult } from "@/types/api";

const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "") + "/api/v1";

// ── Token storage ─────────────────────────────────────────
// Stored in localStorage under these keys.
const ACCESS_KEY  = "logr_access";
const REFRESH_KEY = "logr_refresh";

export const tokenStore = {
  getAccess:    () => (typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY)  : null),
  getRefresh:   () => (typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null),
  set:          (access: string, refresh: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACCESS_KEY,  access);
      localStorage.setItem(REFRESH_KEY, refresh);
      // Synchronize with cookie for Next.js SSR middleware
      document.cookie = `logr_session=${access}; path=/; max-age=86400; SameSite=Lax`;
    }
  },
  clear:        () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
      document.cookie = "logr_session=; path=/; max-age=0; SameSite=Lax";
    }
  },
};

// ── Core fetch wrapper ────────────────────────────────────
interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip attaching the Bearer token (e.g. public endpoints). */
  public?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { body, headers, public: isPublic, ...rest } = options;

  const authHeader: Record<string, string> = {};
  if (!isPublic) {
    const token = tokenStore.getAccess();
    if (token) authHeader["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${BASE}${path}`, {
      ...rest,
      headers: { "Content-Type": "application/json", ...authHeader, ...headers },
      body: body != null ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return { ok: true, data: undefined as T };

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        // Guide: flow errors use { code, message } or { error, message };
        // DRF field errors use { field: [msg] }.
        message: json?.message ?? json?.error ?? json?.detail ?? "Something went wrong.",
        errors: isFieldErrors(json) ? json : undefined,
      };
    }

    return { ok: true, data: json as T };
  } catch {
    return { ok: false, status: 0, message: "Could not reach the server. Check your connection." };
  }
}

/** Guard: DRF field-error objects have string-array values, not strings. */
function isFieldErrors(obj: unknown): obj is Record<string, string[]> {
  if (!obj || typeof obj !== "object") return false;
  return Object.values(obj).some((v) => Array.isArray(v));
}

export const api = {
  get:    <T>(path: string, opts?: Omit<RequestOptions, "body">) => request<T>(path, { method: "GET", ...opts }),
  post:   <T>(path: string, body: unknown, opts?: Omit<RequestOptions, "body">) => request<T>(path, { method: "POST", body, ...opts }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

