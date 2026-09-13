import { NextResponse } from "next/server";

import { config } from "@/lib/config";
import { setAuthCookies } from "@/lib/auth-cookies";

export async function POST(request: Request) {
  const body = await request.json();

  const backendResponse = await fetch(`${config.apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!backendResponse.ok) {
    const error = await backendResponse.json().catch(() => ({ detail: "Login failed" }));
    return NextResponse.json(error, { status: backendResponse.status });
  }

  const tokens = await backendResponse.json();
  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, tokens);
  return response;
}
