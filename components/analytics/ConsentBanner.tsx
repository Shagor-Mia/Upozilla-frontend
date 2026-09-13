"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { CONSENT_STORAGE_KEY } from "@/components/analytics/GTMContainer";

function subscribe() {
  return () => {};
}

function getStoredConsent() {
  return window.localStorage.getItem(CONSENT_STORAGE_KEY);
}

function getServerConsent() {
  return null;
}

export function ConsentBanner() {
  const t = useTranslations("consent");
  const [dismissed, setDismissed] = useState(false);
  const storedConsent = useSyncExternalStore(subscribe, getStoredConsent, getServerConsent);

  function respond(decision: "granted" | "denied") {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, decision);
    setDismissed(true);
    if (decision === "granted") window.location.reload();
  }

  if (dismissed || storedConsent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-muted-foreground">{t("message")}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => respond("denied")}>
            {t("decline")}
          </Button>
          <Button size="sm" onClick={() => respond("granted")}>
            {t("accept")}
          </Button>
        </div>
      </div>
    </div>
  );
}
