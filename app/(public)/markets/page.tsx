import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { MarketGrid } from "@/components/directory/MarketGrid";
import { PageHero } from "@/components/layout/PageHero";
import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { Market, Paginated } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const [t, { site_name }] = await Promise.all([getTranslations("marketsList"), getPublicSettings()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: site_name }),
    alternates: { canonical: "/markets" },
  };
}

export default async function MarketsPage() {
  const t = await getTranslations("marketsList");
  const { items: markets } = await apiGet<Paginated<Market>>("/markets");

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />
      <MarketGrid markets={markets} />
    </div>
  );
}
