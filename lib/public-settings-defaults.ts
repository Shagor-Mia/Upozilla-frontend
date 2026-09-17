import { config } from "@/lib/config";
import type { PublicSettings } from "@/types/api";

/** Env-var defaults, used when the backend is unreachable or has no DB value
 * for a key. A value saved from /admin/settings wins over these. Split out of
 * public-settings.ts (which now touches `next/headers` via apiGet) so this
 * plain-object default stays safe to import from a client component. */
export const ENV_PUBLIC_SETTINGS: PublicSettings = {
  site_name: config.siteName,
  site_url: config.siteUrl,
  site_description: null,
  sms_demo_mode: true,
  otp_login_enabled: true,
  turnstile_site_key: null,
  facebook_app_id: config.facebookAppId || null,
  google_client_id: config.googleClientId || null,
  gtm_id: config.gtmId || null,
  mapbox_token: config.mapboxToken || null,
};
