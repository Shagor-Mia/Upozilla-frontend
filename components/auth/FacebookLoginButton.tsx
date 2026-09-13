"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics";
import { notifyAuthChanged } from "@/lib/auth-events";
import { usePublicSettings } from "@/components/settings/PublicSettingsProvider";

interface FacebookAuthResponse {
  authResponse?: { accessToken: string };
  status: string;
}

declare global {
  interface Window {
    FB?: {
      init: (options: { appId: string; version: string; cookie: boolean; xfbml: boolean }) => void;
      login: (callback: (response: FacebookAuthResponse) => void, options: { scope: string }) => void;
    };
    fbAsyncInit?: () => void;
  }
}

/**
 * Section 16.2 - optional identity path layered on the custom JWT flow. The SDK
 * token is posted to our own `/api/auth/facebook`, which has the backend verify
 * it against the Graph API before issuing our tokens. Renders nothing until
 * a Facebook App ID is configured (admin > Settings > Facebook, or
 * NEXT_PUBLIC_FACEBOOK_APP_ID).
 */
export function FacebookLoginButton({ next }: { next: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const facebookAppId = usePublicSettings().facebook_app_id;

  if (!facebookAppId) return null;

  function handleLogin() {
    if (!window.FB) return;
    setBusy(true);
    setError(null);
    window.FB.login(
      async (response) => {
        const accessToken = response.authResponse?.accessToken;
        if (!accessToken) {
          setError(t("facebookCancelled"));
          setBusy(false);
          return;
        }
        const result = await fetch("/api/auth/facebook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: accessToken }),
        });
        if (!result.ok) {
          const body = await result.json().catch(() => ({ detail: t("facebookFailed") }));
          setError(typeof body.detail === "string" ? body.detail : t("facebookFailed"));
          setBusy(false);
          return;
        }
        trackEvent({ event: "signup", method: "facebook" });
        notifyAuthChanged();
        router.push(next);
        router.refresh();
      },
      { scope: "public_profile,email" }
    );
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="lazyOnload"
        onLoad={() => {
          window.FB?.init({ appId: facebookAppId, version: "v19.0", cookie: false, xfbml: false });
          setReady(true);
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-xl py-6"
        disabled={!ready || busy}
        onClick={handleLogin}
      >
        {busy ? t("facebookConnecting") : t("facebookContinue")}
      </Button>
      {error && <p className="text-body-md text-error">{error}</p>}
    </div>
  );
}
