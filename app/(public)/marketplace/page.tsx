import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PageHero } from "@/components/layout/PageHero";
import { ListingFilters } from "@/components/listings/ListingFilters";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { Pagination } from "@/components/listings/Pagination";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getCategories,
  getExchangeListings,
  getMarketplaceProducts,
  listingUrlParams,
  type ListingSearchParams,
} from "@/lib/listings";
import { getLocationOptions } from "@/lib/locations";
import { getPublicSettings } from "@/lib/public-settings";

/** Exchange (বিনিময়) is a tab on this page, not a separate route - both are
 * buy/sell/trade activity, and the two backends already share categories and
 * every listing component (ListingFilters/ListingGrid/Pagination/ListingDetail). */
function isExchangeTab(searchParams: ListingSearchParams): boolean {
  return searchParams.type === "exchange";
}

function tabHref(searchParams: ListingSearchParams, type: "marketplace" | "exchange"): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(listingUrlParams(searchParams))) {
    if (value !== undefined && key !== "page" && key !== "type") params.set(key, value);
  }
  if (type === "exchange") params.set("type", "exchange");
  const qs = params.toString();
  return qs ? `/marketplace?${qs}` : "/marketplace";
}

export async function generateMetadata(props: PageProps<"/marketplace">): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const exchange = isExchangeTab(searchParams);
  const [t, { site_name }] = await Promise.all([
    getTranslations(exchange ? "exchangePage" : "marketplacePage"),
    getPublicSettings(),
  ]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: site_name }),
    alternates: { canonical: "/marketplace" },
  };
}

export default async function MarketplacePage(props: PageProps<"/marketplace">) {
  const searchParams = await props.searchParams;
  const exchange = isExchangeTab(searchParams);
  const [tMarketplace, tExchange, categories, locations, result] = await Promise.all([
    getTranslations("marketplacePage"),
    getTranslations("exchangePage"),
    getCategories(),
    getLocationOptions(),
    exchange ? getExchangeListings(searchParams) : getMarketplaceProducts(searchParams),
  ]);
  const t = exchange ? tExchange : tMarketplace;
  const countLabel = exchange
    ? tExchange("listingsCount", { count: result.total })
    : tMarketplace("productsCount", { count: result.total });
  const ctaLabel = exchange ? tExchange("postListing") : tMarketplace("listProduct");
  const ctaHref = exchange ? "/sell/exchange" : "/sell/marketplace";

  const tabClass = (active: boolean) =>
    cn(
      "text-label-sm rounded-full border px-4 py-1.5 transition-colors",
      active
        ? "border-primary bg-primary text-on-primary"
        : "border-border-muted bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary"
    );

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href={tabHref(searchParams, "marketplace")} className={tabClass(!exchange)}>
          {tMarketplace("buySellTab")}
        </Link>
        <Link href={tabHref(searchParams, "exchange")} className={tabClass(exchange)}>
          {tMarketplace("exchangeTab")}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-body-md text-on-surface-variant">{countLabel}</p>
        <Button render={<Link href={ctaHref} />} nativeButton={false}>
          {ctaLabel}
        </Button>
      </div>

      <div className="mt-4">
        <Suspense fallback={null}>
          <ListingFilters categories={categories} locations={locations} />
        </Suspense>
      </div>

      <div className="mt-6">
        <ListingGrid listings={result.items} emptyMessage={t("emptyMessage")} />
      </div>

      <Pagination
        page={result.page}
        pageSize={result.page_size}
        total={result.total}
        basePath="/marketplace"
        searchParams={listingUrlParams(searchParams)}
      />
    </div>
  );
}
