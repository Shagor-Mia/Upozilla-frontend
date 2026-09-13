import { NextResponse } from "next/server";

import { setAuthCookies } from "@/lib/auth-cookies";
import { config } from "@/lib/config";

/** Section 16.2: the Facebook SDK token is only ever exchanged server-side; the
 * backend verifies it against the Graph API and issues our own JWT pair. */
export async function POST(request: Request) {
  const body = await request.json();

  const backendResponse = await fetch(`${config.apiBaseUrl}/auth/facebook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendResponse.ok) {
    const error = await backendResponse.json().catch(() => ({ detail: "Facebook login failed" }));
    return NextResponse.json(error, { status: backendResponse.status });
  }

  const tokens = await backendResponse.json();
  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, tokens);
  return response;
}
