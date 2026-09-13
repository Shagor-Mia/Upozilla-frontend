import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/layout/PageHero";
import { config } from "@/lib/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("privacyPage");
  return {
    title: t("metaTitle"),
    description: t("description", { siteName: config.siteName }),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("privacyPage");

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description", { siteName: config.siteName })} />

      <div className="mt-8 max-w-2xl space-y-6">
        <p className="text-body-md text-on-surface-variant">{t("intro", { siteName: config.siteName })}</p>

        <section className="space-y-1.5">
          <h2 className="text-headline-md text-on-surface">{t("collectHeading")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("collectBody")}</p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-headline-md text-on-surface">{t("useHeading")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("useBody")}</p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-headline-md text-on-surface">{t("contactHeading")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("contactBody")}</p>
        </section>
      </div>
    </div>
  );
}
