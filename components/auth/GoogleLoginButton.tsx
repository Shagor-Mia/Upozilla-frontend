"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useRef, useState } from "react";

import { usePublicSettings } from "@/components/settings/PublicSettingsProvider";
import { trackEvent } from "@/lib/analytics";
import { notifyAuthChanged } from "@/lib/auth-events";

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: { theme: string; size: string; shape: string; text: string; width: string }
          ) => void;
        };
      };
    };
  }
}

/**
 * Same optional-identity-path pattern as FacebookLoginButton: the Google
 * Identity Services button hands us a signed ID token, posted to our own
 * `/api/auth/google` - the backend verifies it against Google before issuing
 * our tokens. Renders nothing until a Google Client ID is configured
 * (admin > Settings > Google, or NEXT_PUBLIC_GOOGLE_CLIENT_ID).
 *
 * Unlike Facebook's SDK, Google's branding guidelines require rendering its
 * own button rather than a fully custom one, so this can't match the
 * Button component pixel-for-pixel - only theme/shape/width are tunable.
 */
export function GoogleLoginButton({ next, onSuccess }: { next: string; onSuccess?: () => void }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const googleClientId = usePublicSettings().google_client_id;

  if (!googleClientId) return null;

  async function handleCredential(response: GoogleCredentialResponse) {
    setError(null);
    const result = await fetch("/api/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: response.credential }),
    });
    if (!result.ok) {
      const body = await result.json().catch(() => ({ detail: t("googleFailed") }));
      setError(typeof body.detail === "string" ? body.detail : t("googleFailed"));
      return;
    }
    trackEvent({ event: "signup", method: "google" });
    notifyAuthChanged();
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(next);
      router.refresh();
    }
  }

  return (
    <div className="space-y-2">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="lazyOnload"
        onLoad={() => {
          const container = containerRef.current;
          if (!window.google || !container) return;
          window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleCredential });
          const width = Math.min(400, Math.max(200, container.offsetWidth || 300));
          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            shape: "pill",
            text: "continue_with",
            width: String(width),
          });
        }}
      />
      <div ref={containerRef} className="flex justify-center" />
      {error && <p className="text-body-md text-error">{error}</p>}
    </div>
  );
}
