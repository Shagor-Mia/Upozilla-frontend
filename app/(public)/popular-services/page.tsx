import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BusinessGrid } from "@/components/directory/BusinessGrid";
import { PageHero } from "@/components/layout/PageHero";
import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { Business } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const [t, { site_name }] = await Promise.all([getTranslations("businessPage"), getPublicSettings()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: site_name }),
    alternates: { canonical: "/popular-services" },
  };
}

export default async function PopularServicesPage(props: PageProps<"/popular-services">) {
  const { category } = await props.searchParams;
  const [businesses, t] = await Promise.all([
    apiGet<Business[]>("/businesses", { searchParams: { category: typeof category === "string" ? category : undefined } }),
    getTranslations("businessPage"),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />
      <BusinessGrid businesses={businesses} />
    </div>
  );
}
