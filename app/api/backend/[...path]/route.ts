import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { clearAuthCookies, setAuthCookies } from "@/lib/auth-cookies";
import { config } from "@/lib/config";
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale } from "@/lib/locale";
import { getAccessToken, getRefreshToken } from "@/lib/session";
import { rotateTokens, type TokenPair } from "@/lib/token-refresh";

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

// Access tokens live 30 minutes; before this, an active user doing anything
// mid-session past that mark just got a bare 401 with no recovery (see the
// upazila-redirect-hydration-investigation memory - the 30-day refresh token
// sat unused). One 401 now triggers exactly one silent rotation + retry.
//
// The backend's rotation is one-time-use with reuse detection: replaying an
// already-rotated refresh token revokes every session for the user. If two
// requests hit 401 around the same moment (e.g. a page fires several fetches
// at once right as the token expires), dedupe them to a single in-flight
// rotation within this warm instance instead of racing two independent calls
// against the same cached refresh-token cookie value.
let inFlightRefresh: Promise<TokenPair | null> | null = null;

function refreshOnce(refreshToken: string): Promise<TokenPair | null> {
  if (!inFlightRefresh) {
    inFlightRefresh = rotateTokens(refreshToken).finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
}

async function callBackend(
  target: string,
  method: string,
  headers: Record<string, string>,
  body: string | undefined,
) {
  return fetch(target, { method, headers, body, cache: "no-store" });
}

async function forward(request: Request, ctx: RouteContext<"/api/backend/[...path]">) {
  const { path } = await ctx.params;
  const joined = path.join("/");
  if (!ALLOWED_PREFIXES.some((prefix) => joined.startsWith(prefix))) {
    return NextResponse.json({ detail: "Unknown backend route" }, { status: 404 });
  }

  let accessToken = await getAccessToken();
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? DEFAULT_LOCALE);

  const incoming = new URL(request.url);
  const target = `${config.apiBaseUrl}/${joined}${incoming.search}`;
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const bodyText = hasBody ? await request.text() : undefined;

  const buildHeaders = (token: string | null): Record<string, string> => {
    const headers: Record<string, string> = { "Accept-Language": locale };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (config.tenantSlug) headers["X-Tenant-Slug"] = config.tenantSlug;
    if (hasBody) headers["Content-Type"] = "application/json";
    return headers;
  };

  let backendResponse = await callBackend(target, request.method, buildHeaders(accessToken), bodyText);

  let refreshedTokens: TokenPair | null = null;
  if (backendResponse.status === 401) {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      refreshedTokens = await refreshOnce(refreshToken);
      if (refreshedTokens) {
        accessToken = refreshedTokens.access_token;
        backendResponse = await callBackend(target, request.method, buildHeaders(accessToken), bodyText);
      }
    }
  }

  const applyTokenCookies = (response: NextResponse): NextResponse => {
    if (refreshedTokens) {
      setAuthCookies(response, refreshedTokens);
    } else if (backendResponse.status === 401) {
      // Refresh didn't happen or the refresh token itself is dead - the
      // session is genuinely over. Drop the stale cookies so the next
      // navigation correctly lands on /login instead of proxy.ts finding a
      // cookie that will never work again.
      clearAuthCookies(response);
    }
    return response;
  };

  if (backendResponse.status === 204) {
    return applyTokenCookies(new NextResponse(null, { status: 204 }));
  }
  const data = await backendResponse.json().catch(() => ({}));
  return applyTokenCookies(NextResponse.json(data, { status: backendResponse.status }));
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
