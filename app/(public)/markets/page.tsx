import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { MarketGrid } from "@/components/directory/MarketGrid";
import { PageHero } from "@/components/layout/PageHero";
import { LocationFilterSelect } from "@/components/listings/LocationFilterSelect";
import { apiGet } from "@/lib/api-client";
import { getLocationOptions } from "@/lib/locations";
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

export default async function MarketsPage(props: PageProps<"/markets">) {
  const searchParams = await props.searchParams;
  const [t, tFilters, locations] = await Promise.all([
    getTranslations("marketsList"),
    getTranslations("listingFilters"),
    getLocationOptions(),
  ]);
  const locationId = typeof searchParams.location_id === "string" ? searchParams.location_id : undefined;
  const { items: markets } = await apiGet<Paginated<Market>>("/markets", {
    searchParams: { location_id: locationId },
  });

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />
      <div className="mt-4 max-w-xs">
        <Suspense fallback={null}>
          <LocationFilterSelect
            locations={locations}
            ariaLabel={tFilters("locationAriaLabel")}
            anyLabel={tFilters("anyLocation")}
          />
        </Suspense>
      </div>
      <div className="mt-6">
        <MarketGrid markets={markets} />
      </div>
    </div>
  );
}
