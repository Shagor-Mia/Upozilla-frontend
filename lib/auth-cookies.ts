import "server-only";

import type { NextResponse } from "next/server";

interface TokenPair {
  access_token: string;
  refresh_token: string;
}

// Mirrors backend/app/core/config.py's ACCESS_TOKEN_EXPIRE_MINUTES / REFRESH_TOKEN_EXPIRE_DAYS.
const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 30;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function setAuthCookies(response: NextResponse, tokens: TokenPair): void {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set("access_token", tokens.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
  response.cookies.set("refresh_token", tokens.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
}
