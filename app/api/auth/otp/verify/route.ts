import { NextResponse } from "next/server";

import { setAuthCookies } from "@/lib/auth-cookies";
import { config } from "@/lib/config";
import { getAccessToken } from "@/lib/session";

/** OTP verify issues a fresh token pair (login/register, or verify_phone for a
 * signed-in user so the `phone_verified` claim updates) - store it in the
 * httpOnly cookies like the password login route does. */
export async function POST(request: Request) {
  const body = await request.json();
  const accessToken = await getAccessToken();

  const backendResponse = await fetch(`${config.apiBaseUrl}/auth/otp/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!backendResponse.ok) {
    const error = await backendResponse.json().catch(() => ({ detail: "Verification failed" }));
    return NextResponse.json(error, { status: backendResponse.status });
  }

  const tokens = await backendResponse.json();
  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, tokens);
  return response;
}
