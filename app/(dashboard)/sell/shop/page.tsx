import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ShopForm } from "@/components/shops/ShopForm";
import { TrustGate } from "@/components/listings/TrustGate";
import { apiGet } from "@/lib/api-client";
import { getLocationOptions } from "@/lib/locations";
import { getSession } from "@/lib/session";
import type { Market, Paginated, ShopCategory } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sellShop");
  return { title: t("metaTitle") };
}

export default async function SellShopPage() {
  const t = await getTranslations("sellShop");
  const [session, markets, categories, locations] = await Promise.all([
    getSession(),
    apiGet<Paginated<Market>>("/markets", { revalidateSeconds: 300, searchParams: { page_size: "60" } }),
    apiGet<ShopCategory[]>("/shops/categories", { revalidateSeconds: 3600 }),
    getLocationOptions(),
  ]);
  // Anyone can open and fill this form signed out - only submitting prompts
  // sign-in, in place. An already-signed-in but unverified account is the one
  // case pre-locked here.
  const gateReason = session && !session.phoneVerified ? "verify" : null;
  const marketOptions = markets.items.map((market) => ({ value: market.id, label: market.name }));

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("title")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">{t("description")}</p>
      <TrustGate locked={gateReason !== null} reason={gateReason ?? "signin"} className="mt-6">
        <div className="max-w-2xl rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
          <ShopForm markets={marketOptions} categories={categories} locations={locations} />
        </div>
      </TrustGate>
    </div>
  );
}
