import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ListingGrid } from "@/components/listings/ListingGrid";
import { authApiGet } from "@/lib/admin-api";
import type { FavoritesResponse } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accountFavorites");
  return { title: t("title") };
}

export default async function FavoritesPage() {
  const favorites = await authApiGet<FavoritesResponse>("/exchange/favorites");
  const listings = [...favorites.exchange, ...favorites.marketplace];
  const t = await getTranslations("accountFavorites");

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("title")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">{t("description")}</p>
      <div className="mt-6">
        <ListingGrid listings={listings} emptyMessage={t("emptyMessage")} />
      </div>
    </div>
  );
}
