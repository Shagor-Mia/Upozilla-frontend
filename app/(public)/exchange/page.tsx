import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

import { PageHero } from "@/components/layout/PageHero";
import { ListingFilters } from "@/components/listings/ListingFilters";
import { ListingGrid } from "@/components/listings/ListingGrid";
import { Pagination } from "@/components/listings/Pagination";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";
import { getCategories, getExchangeListings, listingUrlParams } from "@/lib/listings";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("exchangePage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: config.siteName }),
  };
}

export default async function ExchangePage(props: PageProps<"/exchange">) {
  const searchParams = await props.searchParams;
  const [categories, result, t] = await Promise.all([
    getCategories(),
    getExchangeListings(searchParams),
    getTranslations("exchangePage"),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <PageHero title={t("title")} description={t("description")} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-body-md text-on-surface-variant">{t("listingsCount", { count: result.total })}</p>
        <Button render={<Link href="/sell/exchange" />} nativeButton={false}>
          {t("postListing")}
        </Button>
      </div>

      <div className="mt-4">
        <Suspense fallback={null}>
          <ListingFilters categories={categories} />
        </Suspense>
      </div>

      <div className="mt-6">
        <ListingGrid listings={result.items} emptyMessage={t("emptyMessage")} />
      </div>

      <Pagination
        page={result.page}
        pageSize={result.page_size}
        total={result.total}
        basePath="/exchange"
        searchParams={listingUrlParams(searchParams)}
      />
    </div>
  );
}
