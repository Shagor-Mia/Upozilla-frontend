import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { TrustGate } from "@/components/listings/TrustGate";
import { PlaceForm } from "@/components/places/PlaceForm";
import { getLocationOptions } from "@/lib/locations";
import { getSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sellPlace");
  return { title: t("heading") };
}

const CATEGORY_VALUES = ["tourist", "restaurant", "park", "historical", "religious", "natural", "shop"] as const;

export default async function SellPlacePage() {
  const [t, tCategory, session, locations] = await Promise.all([
    getTranslations("sellPlace"),
    getTranslations("placesList.category"),
    getSession(),
    getLocationOptions(),
  ]);
  const categories = CATEGORY_VALUES.map((value) => ({ value, label: tCategory(value) }));

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("heading")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">{t("description")}</p>
      {/* Unlike the marketplace/exchange forms, a place submission only needs
          a signed-in account - no phone verification (product decision). */}
      <TrustGate locked={!session} reason="signin" className="mt-6">
        <div className="max-w-2xl rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
          <PlaceForm categories={categories} locations={locations} />
        </div>
      </TrustGate>
    </div>
  );
}
