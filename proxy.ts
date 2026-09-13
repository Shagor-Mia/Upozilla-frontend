import { NextRequest, NextResponse } from "next/server";

import { isStaff } from "@/lib/roles";

function decodeRoles(token: string): string[] {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(base64)) as { role?: string; roles?: string[] };
    return json.roles ?? (json.role ? [json.role] : []);
  } catch {
    return [];
  }
}

// UX-level route gating only - the backend re-validates the JWT signature and
// role on every API call (Section 12), which is the real authorization boundary.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && !isStaff(decodeRoles(accessToken))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/messages/:path*", "/sell/:path*", "/ask/:path*", "/verify-phone"],
};
