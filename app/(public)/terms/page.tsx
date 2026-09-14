import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PageHero } from "@/components/layout/PageHero";
import { getPublicSettings } from "@/lib/public-settings";

export async function generateMetadata(): Promise<Metadata> {
  const [t, { site_name }] = await Promise.all([getTranslations("termsPage"), getPublicSettings()]);
  return {
    title: t("metaTitle"),
    description: t("description", { siteName: site_name }),
  };
}

export default async function TermsPage() {
  const [t, { site_name }] = await Promise.all([getTranslations("termsPage"), getPublicSettings()]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description", { siteName: site_name })} />

      <div className="mt-8 max-w-2xl space-y-6">
        <p className="text-body-md text-on-surface-variant">{t("intro", { siteName: site_name })}</p>

        <section className="space-y-1.5">
          <h2 className="text-headline-md text-on-surface">{t("accountHeading")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("accountBody")}</p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-headline-md text-on-surface">{t("listingsHeading")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("listingsBody")}</p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-headline-md text-on-surface">{t("liabilityHeading")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("liabilityBody", { siteName: site_name })}</p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-headline-md text-on-surface">{t("lawHeading")}</h2>
          <p className="text-body-md text-on-surface-variant">{t("lawBody")}</p>
        </section>
      </div>
    </div>
  );
}
