import "server-only";

import { cookies } from "next/headers";

import { config } from "@/lib/config";
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale } from "@/lib/locale";

interface ApiGetOptions {
  /** Seconds before Next.js revalidates this fetch (ISR). Omit for the default. */
  revalidateSeconds?: number;
  searchParams?: Record<string, string | undefined>;
}

export class ApiNotFoundError extends Error {}

function buildUrl(path: string, searchParams?: Record<string, string | undefined>): string {
  const url = new URL(`${config.apiBaseUrl}${path}`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined) url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

export async function apiGet<T>(path: string, options: ApiGetOptions = {}): Promise<T> {
  const url = buildUrl(path, options.searchParams);
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE);
  const headers: Record<string, string> = { "Accept-Language": locale };
  if (config.tenantSlug) headers["X-Tenant-Slug"] = config.tenantSlug;
  const response = await fetch(url, {
    headers,
    next: { revalidate: options.revalidateSeconds ?? 300 },
  });

  if (response.status === 404) {
    throw new ApiNotFoundError(`Not found: ${path}`);
  }
  if (!response.ok) {
    throw new Error(`API request failed (${response.status}): ${path}`);
  }
  return response.json() as Promise<T>;
}
