import "server-only";

import { cookies } from "next/headers";

import { config } from "@/lib/config";
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale } from "@/lib/locale";
import { getAuthHeader } from "@/lib/session";

/** Authenticated server-side GET for user- or role-gated backend endpoints
 * (admin dashboard, /auth/me, my listings, conversations...). Public content
 * lists (places, services, ...) should use apiGet instead - they don't require
 * a token and benefit from apiGet's ISR caching. */
export async function authApiGet<T>(path: string): Promise<T> {
  const authHeader = await getAuthHeader();
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE);
  const headers: Record<string, string> = { ...authHeader, "Accept-Language": locale };
  if (config.tenantSlug) headers["X-Tenant-Slug"] = config.tenantSlug;
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Authenticated API request failed (${response.status}): ${path}`);
  }
  return response.json() as Promise<T>;
}
