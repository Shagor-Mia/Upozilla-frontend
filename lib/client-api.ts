/**
 * Browser-side helper for authenticated backend calls, routed through the
 * `/api/backend/[...path]` proxy so the httpOnly JWT cookie is attached
 * server-side. Public, cacheable reads in server components should keep using
 * `apiGet` from `lib/api-client.ts` instead.
 */

export class ClientApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
  }

  get isUnauthenticated() {
    return this.status === 401;
  }

  get isPhoneVerificationRequired() {
    return this.status === 403 && /phone verification/i.test(this.message);
  }
}

function describeDetail(detail: unknown, fallback: string): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const first = detail[0] as { msg?: string; loc?: unknown[] } | undefined;
    if (first?.msg) {
      const field = Array.isArray(first.loc) ? String(first.loc[first.loc.length - 1]) : "";
      return field ? `${field}: ${first.msg}` : first.msg;
    }
  }
  return fallback;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/backend/${path.replace(/^\//, "")}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ClientApiError(response.status, describeDetail(data?.detail, `Request failed (${response.status})`));
  }
  return data as T;
}

export const clientApi = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body ?? {}),
  patch: <T>(path: string, body: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body ?? {}),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
