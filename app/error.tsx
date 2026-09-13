"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-4 px-4 py-24 text-center md:px-12">
      <h1 className="text-headline-lg text-on-surface">{t("errorTitle")}</h1>
      <p className="text-body-md text-on-surface-variant">{t("errorBody")}</p>
      <Button onClick={reset} className="rounded-xl">
        {t("tryAgain")}
      </Button>
    </div>
  );
}
