import "server-only";

import { cookies } from "next/headers";

export interface Session {
  userId: string;
  tenantId: string | null;
  role: string | null;
  roles: string[];
  /** UX hint from the JWT claim - the backend re-checks the DB on every gated write. */
  phoneVerified: boolean;
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64);
}

interface AccessTokenPayload {
  sub: string;
  tenant_id?: string | null;
  role?: string | null;
  roles?: string[];
  phone_verified?: boolean;
  exp: number;
}

function decodeAccessToken(token: string): AccessTokenPayload | null {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(base64UrlDecode(payload)) as AccessTokenPayload;
  } catch {
    return null;
  }
}

/** Reads and decodes the access_token cookie. Not signature-verified - this is a
 * display/UX-only session read. The backend re-validates the JWT signature and
 * role on every API call, which is the actual authorization boundary. */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return null;

  const payload = decodeAccessToken(accessToken);
  if (!payload) return null;
  if (payload.exp * 1000 < Date.now()) return null;

  const role = payload.role ?? null;
  return {
    userId: payload.sub,
    tenantId: payload.tenant_id ?? null,
    role,
    roles: payload.roles ?? (role ? [role] : []),
    phoneVerified: payload.phone_verified ?? false,
  };
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("refresh_token")?.value ?? null;
}

export async function getAuthHeader(): Promise<{ Authorization: string }> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}
