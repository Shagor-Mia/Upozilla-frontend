import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ListingForm } from "@/components/listings/ListingForm";
import { TrustGate } from "@/components/listings/TrustGate";
import { apiGet } from "@/lib/api-client";
import { getCategories } from "@/lib/listings";
import { getLocationOptions } from "@/lib/locations";
import { getSession } from "@/lib/session";
import type { Business } from "@/types/api";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sellMarketplace");
  return { title: t("heading") };
}

export default async function SellMarketplacePage() {
  const t = await getTranslations("sellMarketplace");
  const [session, categories, locations, businesses] = await Promise.all([
    getSession(),
    getCategories(),
    getLocationOptions(),
    apiGet<Business[]>("/businesses", { revalidateSeconds: 60 }),
  ]);
  const verified = session?.phoneVerified ?? false;
  const ownBusinesses = businesses.filter((business) => business.owner_user_id === session?.userId);

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("heading")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">
        {t("description")}
      </p>
      <TrustGate locked={!verified} reason="verify" next="/sell/marketplace" className="mt-6">
        <div className="max-w-2xl rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
          <ListingForm listingType="marketplace" categories={categories} locations={locations} businesses={ownBusinesses} />
        </div>
      </TrustGate>
    </div>
  );
}
