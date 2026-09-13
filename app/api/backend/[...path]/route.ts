import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { config } from "@/lib/config";
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale } from "@/lib/locale";
import { getAccessToken } from "@/lib/session";

/**
 * Generic authenticated proxy for browser -> FastAPI calls. The JWT lives in an
 * httpOnly cookie (never readable by client JS), so client components call
 * `/api/backend/<path>` and this handler attaches the Bearer token server-side.
 *
 * Only the prefixes below are forwarded - everything else 404s - so this can't
 * be used to reach arbitrary backend routes with the user's token.
 *
 * The four public directory lists are included so the "near me" refetch
 * (browser geolocation -> `?lat&lng&radius_km`) also stays on the Next.js
 * origin instead of calling the FastAPI host directly from the browser.
 */
const ALLOWED_PREFIXES = [
  "auth/me",
  "auth/ws-ticket",
  "auth/logout-all",
  "auth/otp/",
  "users/me",
  "marketplace/",
  "exchange/",
  "sellers/",
  "conversations",
  "moderation/",
  "admin/",
  "hospitals",
  "markets",
  "places",
  "businesses",
  "services",
  "news",
  "shops",
  "representatives",
  "faqs",
  "ai/",
  "recommendations",
];

async function forward(request: Request, ctx: RouteContext<"/api/backend/[...path]">) {
  const { path } = await ctx.params;
  const joined = path.join("/");
  if (!ALLOWED_PREFIXES.some((prefix) => joined.startsWith(prefix))) {
    return NextResponse.json({ detail: "Unknown backend route" }, { status: 404 });
  }

  const accessToken = await getAccessToken();
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE);
  const headers: Record<string, string> = { "Accept-Language": locale };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (config.tenantSlug) headers["X-Tenant-Slug"] = config.tenantSlug;

  const incoming = new URL(request.url);
  const target = `${config.apiBaseUrl}/${joined}${incoming.search}`;

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  if (hasBody) headers["Content-Type"] = "application/json";

  const backendResponse = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
  });

  if (backendResponse.status === 204) {
    return new NextResponse(null, { status: 204 });
  }
  const data = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(data, { status: backendResponse.status });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
