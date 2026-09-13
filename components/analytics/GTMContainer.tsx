"use client";

import Script from "next/script";
import { useSyncExternalStore } from "react";

import { usePublicSettings } from "@/components/settings/PublicSettingsProvider";

const CONSENT_STORAGE_KEY = "upazila-tracking-consent";

function subscribe() {
  return () => {};
}

function getStoredConsent() {
  return window.localStorage.getItem(CONSENT_STORAGE_KEY);
}

function getServerConsent() {
  return null;
}

/**
 * Single injection point for GTM (Section 16.1) — GA4 + Meta Pixel live inside
 * the GTM container itself, never as separate hardcoded script tags here.
 * Marketing tags only fire after consent, per Section 16.1's consent note.
 */
export function GTMContainer() {
  const storedConsent = useSyncExternalStore(subscribe, getStoredConsent, getServerConsent);
  const gtmId = usePublicSettings().gtm_id;

  if (!gtmId || storedConsent !== "granted") return null;

  return (
    <>
      <Script id="gtm-init" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
          var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
          j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  );
}

export { CONSENT_STORAGE_KEY };
