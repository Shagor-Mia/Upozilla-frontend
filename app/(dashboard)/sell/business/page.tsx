import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BusinessForm } from "@/components/businesses/BusinessForm";
import { TrustGate } from "@/components/listings/TrustGate";
import { getLocationOptions } from "@/lib/locations";
import { getPublicSettings } from "@/lib/public-settings";
import { getSession } from "@/lib/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("sellBusiness");
  return { title: t("heading") };
}

const CATEGORY_VALUES = [
  "bank",
  "bkash_point",
  "robi_point",
  "atm_booth",
  "car_rental",
  "ekota_bus_service",
  "dhaka_homna_bus_service",
] as const;

export default async function SellBusinessPage() {
  const [t, tCategory, session, locations, { site_name }] = await Promise.all([
    getTranslations("sellBusiness"),
    getTranslations("businessPage.category"),
    getSession(),
    getLocationOptions(),
    getPublicSettings(),
  ]);
  const categories = CATEGORY_VALUES.map((value) => ({
    value,
    label: tCategory(value, { siteName: site_name }),
  }));

  return (
    <div>
      <h1 className="text-headline-lg text-on-surface">{t("heading")}</h1>
      <p className="text-body-md mt-1 text-on-surface-variant">{t("description")}</p>
      {/* Like sell/place: only a signed-in account is required, no phone
          verification. Unlike sell/place, there is no moderation queue here -
          submitting publishes the business immediately (product decision). */}
      <TrustGate locked={!session} reason="signin" className="mt-6">
        <div className="max-w-2xl rounded-xl border border-border-muted bg-surface-container-lowest p-6 shadow-card">
          <BusinessForm categories={categories} locations={locations} />
        </div>
      </TrustGate>
    </div>
  );
}
