import { config } from "@/lib/config";

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

/**
 * Rotates the long-lived (30d) refresh token for a fresh access/refresh pair,
 * via the backend's one-time-use `POST /auth/refresh` (`rotate_refresh_token`
 * in `backend/app/modules/auth/service.py`). Access tokens only live 30
 * minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`) and nothing called this endpoint
 * before - see the `upazila-redirect-hydration-investigation` memory - so an
 * active user was silently bounced to /login every 30 minutes despite a
 * perfectly good refresh token sitting unused in the next cookie.
 *
 * Returns null on any failure (expired/revoked/reused refresh token, network
 * error) - callers should treat that the same as "no session," never throw.
 *
 * The backend rotation is one-time-use with reuse detection: replaying an
 * already-rotated refresh token revokes every session for the user. Callers
 * that might fire several requests concurrently right at the 30-minute mark
 * (e.g. `app/api/backend/[...path]/route.ts`) should dedupe concurrent calls
 * to this function to the same in-flight promise rather than calling it
 * independently per request.
 */
export async function rotateTokens(refreshToken: string): Promise<TokenPair | null> {
  try {
    const res = await fetch(`${config.apiBaseUrl}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as TokenPair;
  } catch {
    return null;
  }
}
