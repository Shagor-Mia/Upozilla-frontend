import { NextRequest, NextResponse } from "next/server";

import { clearAuthCookies, setAuthCookies } from "@/lib/auth-cookies";
import { isStaff } from "@/lib/roles";
import { rotateTokens } from "@/lib/token-refresh";

interface AccessTokenPayload {
  role?: string;
  roles?: string[];
  exp?: number;
}

function decodeToken(token: string): AccessTokenPayload | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as AccessTokenPayload;
  } catch {
    return null;
  }
}

function rolesFrom(payload: AccessTokenPayload | null): string[] {
  if (!payload) return [];
  return payload.roles ?? (payload.role ? [payload.role] : []);
}

function isExpired(payload: AccessTokenPayload | null): boolean {
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now();
}

// UX-level route gating only - the backend re-validates the JWT signature and
// role on every API call (Section 12), which is the real authorization boundary.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  let payload = accessToken ? decodeToken(accessToken) : null;
  let freshTokens: Awaited<ReturnType<typeof rotateTokens>> = null;

  // Access tokens live 30 minutes and nothing used to refresh them before a
  // navigation landed here past that mark, silently bouncing an active user
  // to /login even though their 30-day refresh token was still good (see the
  // upazila-redirect-hydration-investigation memory). Rotate once here so a
  // plain page navigation recovers instead of forcing a re-login - this
  // request still renders against the old (just-expired) token below, so an
  // already-signed-in page can briefly under-render a permission-gated
  // section; it self-corrects on the very next navigation once the browser
  // sends the refreshed cookie back. `app/api/backend/[...path]/route.ts`
  // covers the in-page-action case with a full same-request retry.
  if ((!accessToken || !payload || isExpired(payload)) && refreshToken) {
    freshTokens = await rotateTokens(refreshToken);
    if (freshTokens) payload = decodeToken(freshTokens.access_token);
  }

  if (!payload || isExpired(payload)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (accessToken || refreshToken) clearAuthCookies(response);
    return response;
  }

  if (pathname.startsWith("/admin") && !isStaff(rolesFrom(payload))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();
  if (freshTokens) setAuthCookies(response, freshTokens);
  return response;
}

// /sell/* is intentionally NOT gated here: those pages are public so anyone
// can browse them, and the sign-in/verify-phone prompt now opens as an
// in-place modal (AuthModalProvider) exactly when the visitor tries to
// submit, rather than bouncing them off the page before they can even see it.
export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/messages/:path*", "/ask/:path*", "/verify-phone"],
};
