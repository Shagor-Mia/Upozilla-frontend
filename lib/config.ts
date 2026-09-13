const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export const config = {
  apiBaseUrl,
  /** Browser-side WebSocket origin (Section 10). Derived from the API URL unless overridden. */
  wsBaseUrl:
    process.env.NEXT_PUBLIC_WS_BASE_URL ?? apiBaseUrl.replace(/^http/, "ws"),
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? "Upazila Digital Ecosystem",
  gtmId: process.env.NEXT_PUBLIC_GTM_ID ?? "",
  mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "",
  /** Facebook Login (Section 16.2). Empty = the button is not rendered. */
  facebookAppId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ?? "",
  /** Google Login (same pattern). Empty = the button is not rendered. */
  googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "",
  /**
   * This deployment's tenant slug, sent as `X-Tenant-Slug` on every backend
   * call so anonymous requests resolve to the right tenant (`resolve_tenant_id`
   * in the backend, Section 13 Phase 5). Server-only - the browser never talks
   * to FastAPI directly, only through the `/api/backend` proxy, so this never
   * needs a `NEXT_PUBLIC_` prefix. Blank is safe today (single-tenant
   * deployment): the backend falls back to the oldest active tenant.
   */
  tenantSlug: process.env.TENANT_SLUG ?? "",
};
