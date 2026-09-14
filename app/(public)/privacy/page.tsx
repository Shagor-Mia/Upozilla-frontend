import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/layout/PageHero";
import { getPublicSettings } from "@/lib/public-settings";

export async function generateMetadata(): Promise<Metadata> {
  const [t, { site_name }] = await Promise.all([getTranslations("privacyPage"), getPublicSettings()]);
  return {
    title: t("metaTitle"),
    description: t("description", { siteName: site_name }),
  };
}

export default async function PrivacyPage() {
  const [t, { site_name }] = await Promise.all([getTranslations("privacyPage"), getPublicSettings()]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description", { siteName: site_name })} />

      <div className="mt-8 max-w-2xl space-y-6">
        <p className="text-body-md text-on-surface-variant">{t("intro", { siteName: site_name })}</p>

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
