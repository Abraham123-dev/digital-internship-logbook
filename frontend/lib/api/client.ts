import type { ApiResult } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const { body, headers, ...rest } = options;
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      // credentials: "include" sends httpOnly cookies on cross-origin requests.
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: body != null ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return { ok: true, data: undefined as T };

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        // Django DRF uses `detail` for single errors, `errors` for field errors.
        message: json?.detail ?? json?.message ?? "Something went wrong.",
        errors: json?.errors,
      };
    }

    return { ok: true, data: json as T };
  } catch {
    return { ok: false, status: 0, message: "Could not reach the server. Check your connection." };
  }
}

export const api = {
  get:    <T>(path: string, opts?: Omit<RequestOptions, "body">) => request<T>(path, { method: "GET", ...opts }),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: "POST", body }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: "PATCH", body }),
  put:    <T>(path: string, body: unknown) => request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
