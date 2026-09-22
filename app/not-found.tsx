import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PublicSiteChrome } from "@/components/layout/PublicSiteChrome";
import { Button } from "@/components/ui/button";

// This lives outside every route group, so it's the fallback for any URL that
// matches nothing at all - Next.js then renders it nested only in the root
// layout, which no longer carries the public header/footer itself (see
// PublicSiteChrome). Rendering that chrome explicitly here keeps a stray/typo
// URL from landing on a bare page with no way to navigate elsewhere.
export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <PublicSiteChrome>
      <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-4 px-4 py-24 text-center md:px-12">
        <h1 className="text-headline-lg text-on-surface">{t("notFoundTitle")}</h1>
        <p className="text-body-md text-on-surface-variant">{t("notFoundBody")}</p>
        <Button render={<Link href="/" />} nativeButton={false} className="rounded-xl">
          {t("backHome")}
        </Button>
      </div>
    </PublicSiteChrome>
  );
}
