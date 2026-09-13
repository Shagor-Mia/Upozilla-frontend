import { NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/auth-cookies";
import { config } from "@/lib/config";
import { getRefreshToken } from "@/lib/session";

export async function POST() {
  // Section 14.2: revoke the refresh token server-side, not just drop the cookie.
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await fetch(`${config.apiBaseUrl}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
