import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ShopGrid } from "@/components/directory/ShopGrid";
import { PageHero } from "@/components/layout/PageHero";
import { Button } from "@/components/ui/button";
import { apiGet } from "@/lib/api-client";
import { getPublicSettings } from "@/lib/public-settings";
import { cn } from "@/lib/utils";
import type { Paginated, Shop, ShopCategory } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const [t, { site_name }] = await Promise.all([getTranslations("shopsPage"), getPublicSettings()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription", { siteName: site_name }),
    alternates: { canonical: "/shops" },
  };
}

export default async function ShopsPage(props: PageProps<"/shops">) {
  const { category_id } = await props.searchParams;
  const selectedCategoryId = typeof category_id === "string" ? category_id : undefined;
  const [t, categories, shopsPage] = await Promise.all([
    getTranslations("shopsPage"),
    apiGet<ShopCategory[]>("/shops/categories", { revalidateSeconds: 3600 }),
    apiGet<Paginated<Shop>>("/shops", { searchParams: { category_id: selectedCategoryId, page_size: "60" } }),
  ]);

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHero title={t("title")} description={t("description")} />
        <Button render={<Link href="/sell/shop" />} nativeButton={false} className="rounded-xl">
          {t("addShop")}
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/shops"
          className={cn(
            "text-label-sm rounded-full px-4 py-2 transition-colors",
            !selectedCategoryId
              ? "bg-primary text-on-primary"
              : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
          )}
        >
          {t("allCategories")}
        </Link>
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/shops?category_id=${category.id}`}
            className={cn(
              "text-label-sm rounded-full px-4 py-2 transition-colors",
              selectedCategoryId === category.id
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>

      <ShopGrid shops={shopsPage.items} emptyMessage={t("emptyState")} independentLabel={t("independentBadge")} />
    </div>
  );
}
