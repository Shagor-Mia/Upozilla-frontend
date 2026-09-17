import "server-only";

import { apiGet } from "@/lib/api-client";
import { ENV_PUBLIC_SETTINGS } from "@/lib/public-settings-defaults";
import type { PublicSettings } from "@/types/api";

/** Server-side fetch for the root layout. Cached (ISR) so it doesn't make
 * every page dynamic. */
export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    const remote = await apiGet<PublicSettings>("/settings/public", { revalidateSeconds: 60 });
    return {
      site_name: remote.site_name || ENV_PUBLIC_SETTINGS.site_name,
      site_url: remote.site_url || ENV_PUBLIC_SETTINGS.site_url,
      site_description: remote.site_description ?? ENV_PUBLIC_SETTINGS.site_description,
      sms_demo_mode: remote.sms_demo_mode,
      otp_login_enabled: remote.otp_login_enabled,
      turnstile_site_key: remote.turnstile_site_key ?? ENV_PUBLIC_SETTINGS.turnstile_site_key,
      facebook_app_id: remote.facebook_app_id ?? ENV_PUBLIC_SETTINGS.facebook_app_id,
      google_client_id: remote.google_client_id ?? ENV_PUBLIC_SETTINGS.google_client_id,
      gtm_id: remote.gtm_id ?? ENV_PUBLIC_SETTINGS.gtm_id,
      mapbox_token: remote.mapbox_token ?? ENV_PUBLIC_SETTINGS.mapbox_token,
    };
  } catch {
    return ENV_PUBLIC_SETTINGS;
  }
}
