import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PlaceGrid } from "@/components/directory/PlaceGrid";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import type { Paginated, Place } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const [t, { site_name }] = await Promise.all([getTranslations("placesList"), getPublicSettings()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: site_name }),
    alternates: { canonical: "/places" },
  };
}

export default async function PlacesPage(props: PageProps<"/places">) {
  const { category } = await props.searchParams;
  const [t, tSell, { items: places }] = await Promise.all([
    getTranslations("placesList"),
    getTranslations("sell"),
    apiGet<Paginated<Place>>("/places", { searchParams: { category: typeof category === "string" ? category : undefined } }),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />
      <div className="mt-6 flex justify-end">
        <Button render={<Link href="/sell/place" />} nativeButton={false}>
          {tSell("placeTitle")}
        </Button>
      </div>
      <PlaceGrid places={places} />
    </div>
  );
}
