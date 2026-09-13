import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ShopForm } from "@/components/shops/ShopForm";
import { TrustGate } from "@/components/listings/TrustGate";
import { apiGet } from "@/lib/api-client";
import { getSession } from "@/lib/session";
import type { Market, Paginated, ShopCategory } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sellShop");
  return { title: t("metaTitle") };
}

export default async function SellShopPage() {
  const t = await getTranslations("sellShop");
  const [session, markets, categories] = await Promise.all([
    getSession(),
    apiGet<Paginated<Market>>("/markets", { revalidateSeconds: 300, searchParams: { page_size: "60" } }),
    apiGet<ShopCategory[]>("/shops/categories", { revalidateSeconds: 3600 }),
  ]);
  const verified = session?.phoneVerified ?? false;
  const marketOptions = markets.items.map((market) => ({ value: market.id, label: market.name }));

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("title")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">{t("description")}</p>
      <TrustGate locked={!verified} reason="verify" next="/sell/shop" className="mt-6">
        <div className="max-w-2xl rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
          <ShopForm markets={marketOptions} categories={categories} />
        </div>
      </TrustGate>
    </div>
  );
}
