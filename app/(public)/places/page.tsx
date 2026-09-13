import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { PlaceGrid } from "@/components/directory/PlaceGrid";
import { PageHero } from "@/components/layout/PageHero";
import { apiGet } from "@/lib/api-client";
import { config } from "@/lib/config";
import type { Paginated, Place } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("placesList");
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: config.siteName }),
  };
}

export default async function PlacesPage() {
  const t = await getTranslations("placesList");
  const { items: places } = await apiGet<Paginated<Place>>("/places");

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />
      <PlaceGrid places={places} />
    </div>
  );
}
